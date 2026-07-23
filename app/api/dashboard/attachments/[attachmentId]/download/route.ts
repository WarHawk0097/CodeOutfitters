import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUuid, isDownloadable } from '@/lib/dashboard/validation'
import { SupabaseInquiryStorageProvider } from '@/lib/inquiry/server/storage/supabase-inquiry-storage-provider'

// Short-lived signed URL for the private inquiry-attachments bucket. Minted
// server-side ONLY after the full authorization chain passes, and never stored
// or logged. Defense in depth:
//   1. attachmentId must be a well-formed UUID (no path/object input from the client).
//   2. A live session is required (getUser()).
//   3. The row is fetched through the RLS-scoped authenticated client, so it is
//      returned ONLY when it is associated to a lead in a workspace the caller
//      is a member of (cross-workspace + unassociated rows are invisible → 404).
//   4. The file must be fully uploaded and malware-clean (isDownloadable).
//   5. The storage_key comes from that authorized DB row — never the URL — which
//      blocks object-path substitution and traversal.
// Every denial returns an identical 404 so attachment existence never leaks.
const SIGNED_URL_TTL_SECONDS = 60

const notFound = () =>
  NextResponse.json({ error: 'Not found' }, { status: 404 })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  if (!isUuid(attachmentId)) return notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: row, error } = await supabase
    .from('inquiry_attachments')
    .select('storage_key, lead_id, upload_status, scan_status')
    .eq('id', attachmentId)
    .maybeSingle()

  if (error || !row) return notFound()

  if (
    !isDownloadable({
      leadId: (row.lead_id as string | null) ?? null,
      uploadStatus: row.upload_status as string,
      scanStatus: row.scan_status as string,
    })
  ) {
    return notFound()
  }

  const storageKey = row.storage_key as string
  if (!storageKey) return notFound()

  let signedUrl: string
  try {
    const provider = new SupabaseInquiryStorageProvider()
    const signed = await provider.createSignedDownload(storageKey, SIGNED_URL_TTL_SECONDS)
    signedUrl = signed.url
  } catch {
    // Fail closed without echoing storage internals.
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  const res = NextResponse.redirect(signedUrl, 302)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
