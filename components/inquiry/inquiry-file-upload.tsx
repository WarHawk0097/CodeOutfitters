'use client'

// Supporting-files step — ACTIVATED in Work Order E. Two-phase secure upload
// against the private Supabase Storage bucket:
//   1. POST /api/inquiries/uploads/authorize  -> signed PUT + attachmentId
//   2. PUT the bytes straight to Storage (XHR, for progress)
//   3. POST /api/inquiries/uploads/complete   -> server verifies + malware-scans,
//      and only on a CLEAN scan mints the opaque attachment token this component
//      reports upward. A rejected/failed file yields NO token and cannot be
//      submitted. Removing an uploaded file calls DELETE so no orphan lingers.
// The server re-validates everything; the client checks are UX only.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Paperclip, X, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  FORM_UPLOAD_LIMITS_CLIENT,
  UPLOAD_ACCEPT_ATTRIBUTE,
  extensionOf,
  type UploadFormVariantClient,
} from '@/lib/inquiry/inquiry-upload-validation'
import { trackInquiryEvent, type InquiryAnalyticsPayload } from '@/lib/inquiry/inquiry-analytics'

type Phase = 'authorizing' | 'uploading' | 'scanning' | 'complete' | 'rejected' | 'failed'

type Item = {
  localId: string
  name: string
  size: number
  phase: Phase
  progress: number // 0..100 during 'uploading'
  attachmentId?: string
  token?: string
  error?: string
}

const CATEGORY: Record<string, NonNullable<InquiryAnalyticsPayload['fileCategory']>> = {
  pdf: 'pdf', doc: 'doc', docx: 'docx', xlsx: 'xlsx', csv: 'csv', png: 'png', jpg: 'jpg', jpeg: 'jpeg',
}

function fileCategory(name: string) {
  return CATEGORY[extensionOf(name)]
}
function sizeBucket(bytes: number): NonNullable<InquiryAnalyticsPayload['sizeBucket']> {
  if (bytes < 1024 * 1024) return 'under_1mb'
  if (bytes < 5 * 1024 * 1024) return '1_5mb'
  if (bytes <= 10 * 1024 * 1024) return '5_10mb'
  return 'over_10mb'
}

function newLocalId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// XHR (not fetch) so we get real upload progress for the signed PUT.
function putWithProgress(
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT ${xhr.status}`))
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(file)
  })
}

export function InquiryFileUpload({
  formVariant,
  sourcePage,
  submissionId,
  onTokensChange,
  onCompletedFilesChange,
}: {
  formVariant: UploadFormVariantClient
  sourcePage: string
  submissionId: string
  // Reports the current set of CLEAN, submittable tokens whenever it changes.
  onTokensChange?: (tokens: string[]) => void
  // Reports the CLEAN, completed file names (for a Review summary). Names only.
  onCompletedFilesChange?: (files: string[]) => void
}) {
  const limits = FORM_UPLOAD_LIMITS_CLIENT[formVariant]
  const [items, setItems] = useState<Item[]>([])
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const routeLabel = `${sourcePage}:${formVariant}`

  // Report CLEAN tokens/filenames to the parent AFTER commit, never inside a
  // state updater: an updater must stay pure, and updating a parent from a
  // child's render throws "Cannot update a component while rendering a different
  // component". Callbacks live in refs so this effect keys on items alone and
  // inline parent callbacks don't retrigger it.
  const onTokensChangeRef = useRef(onTokensChange)
  const onCompletedFilesChangeRef = useRef(onCompletedFilesChange)
  onTokensChangeRef.current = onTokensChange
  onCompletedFilesChangeRef.current = onCompletedFilesChange
  useEffect(() => {
    const done = items.filter((i) => i.phase === 'complete' && i.token)
    onTokensChangeRef.current?.(done.map((i) => i.token!))
    onCompletedFilesChangeRef.current?.(done.map((i) => i.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const patch = useCallback((localId: string, updater: (i: Item) => Item) => {
    setItems((prev) => prev.map((i) => (i.localId === localId ? updater(i) : i)))
  }, [])

  const isAllowed = (file: File) =>
    (file.type && ALLOWED_MIME_TYPES.has(file.type)) ||
    ALLOWED_EXTENSIONS.includes(extensionOf(file.name) as (typeof ALLOWED_EXTENSIONS)[number])

  const run = useCallback(
    async (item: Item, file: File) => {
      const base: InquiryAnalyticsPayload = {
        formVariant,
        sourcePage,
        route: routeLabel,
        fileCategory: fileCategory(file.name),
        sizeBucket: sizeBucket(file.size),
      }
      try {
        const authRes = await fetch('/api/inquiries/uploads/authorize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            formVariant,
            filename: file.name,
            declaredMime: file.type || '',
            byteSize: file.size,
          }),
        })
        const auth = await authRes.json()
        if (!authRes.ok || !auth.ok) {
          patch(item.localId, (i) => ({ ...i, phase: 'failed', error: 'Could not start upload.' }))
          trackInquiryEvent('inquiry_upload_failed', { ...base, failureCategory: 'authorize_error' })
          return
        }
        trackInquiryEvent('inquiry_upload_authorized', base)
        patch(item.localId, (i) => ({ ...i, phase: 'uploading', attachmentId: auth.attachmentId }))
        trackInquiryEvent('inquiry_upload_started', base)

        await putWithProgress(auth.uploadUrl, auth.headers ?? {}, file, (pct) =>
          patch(item.localId, (i) => (i.phase === 'uploading' ? { ...i, progress: pct } : i)),
        )

        patch(item.localId, (i) => ({ ...i, phase: 'scanning', progress: 100 }))
        const compRes = await fetch('/api/inquiries/uploads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ submissionId, attachmentId: auth.attachmentId }),
        })
        const comp = await compRes.json()
        if (!compRes.ok || !comp.ok) {
          const rejected = comp?.error?.code === 'scan_rejected'
          patch(item.localId, (i) => ({
            ...i,
            phase: rejected ? 'rejected' : 'failed',
            error: rejected ? 'File failed the malware scan and was removed.' : 'Upload could not be completed.',
          }))
          trackInquiryEvent('inquiry_upload_failed', {
            ...base,
            failureCategory: rejected ? 'scan_rejected' : 'upload_error',
          })
          return
        }
        if (comp.scanStatus === 'clean' && comp.attachmentToken) {
          patch(item.localId, (i) => ({ ...i, phase: 'complete', token: comp.attachmentToken }))
          trackInquiryEvent('inquiry_upload_completed', base)
        } else {
          // Scanner unavailable/failed open: no token, cannot be submitted.
          patch(item.localId, (i) => ({
            ...i,
            phase: 'failed',
            error: 'File could not be verified. Please try again.',
          }))
          trackInquiryEvent('inquiry_upload_failed', { ...base, failureCategory: 'scan_unavailable' })
        }
      } catch {
        patch(item.localId, (i) => ({ ...i, phase: 'failed', error: 'Network error during upload.' }))
        trackInquiryEvent('inquiry_upload_failed', { ...base, failureCategory: 'upload_error' })
      }
    },
    [formVariant, sourcePage, routeLabel, submissionId, patch],
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setNotice(null)
      const incoming = Array.from(files)
      setItems((prev) => {
        const live = prev.filter((i) => i.phase !== 'rejected' && i.phase !== 'failed')
        let totalBytes = live.reduce((s, i) => s + i.size, 0)
        let count = live.length
        const accepted: { item: Item; file: File }[] = []
        for (const file of incoming) {
          const rejectBase: InquiryAnalyticsPayload = {
            formVariant,
            sourcePage,
            route: routeLabel,
            fileCategory: fileCategory(file.name),
            sizeBucket: sizeBucket(file.size),
          }
          if (!isAllowed(file)) {
            setNotice(`"${file.name}" is not a supported file type.`)
            trackInquiryEvent('inquiry_file_rejected', { ...rejectBase, failureCategory: 'unsupported_type' })
            continue
          }
          if (file.size > limits.maxFileBytes) {
            setNotice(`"${file.name}" exceeds the 10 MB limit.`)
            trackInquiryEvent('inquiry_file_rejected', { ...rejectBase, failureCategory: 'too_large' })
            continue
          }
          if (count >= limits.maxFiles) {
            setNotice(`You can attach up to ${limits.maxFiles} file${limits.maxFiles > 1 ? 's' : ''}.`)
            trackInquiryEvent('inquiry_file_rejected', { ...rejectBase, failureCategory: 'too_many' })
            continue
          }
          if (totalBytes + file.size > limits.maxTotalBytes) {
            setNotice('Attachments exceed the total size limit for this form.')
            trackInquiryEvent('inquiry_file_rejected', { ...rejectBase, failureCategory: 'too_large' })
            continue
          }
          const item: Item = {
            localId: newLocalId(),
            name: file.name,
            size: file.size,
            phase: 'authorizing',
            progress: 0,
          }
          accepted.push({ item, file })
          totalBytes += file.size
          count += 1
          trackInquiryEvent('inquiry_file_selected', { ...rejectBase })
        }
        // Kick off uploads after this state commit.
        queueMicrotask(() => accepted.forEach(({ item, file }) => run(item, file)))
        return [...prev, ...accepted.map((a) => a.item)]
      })
    },
    [formVariant, sourcePage, routeLabel, limits, run],
  )

  const remove = useCallback(
    async (item: Item) => {
      setItems((prev) => prev.filter((i) => i.localId !== item.localId))
      trackInquiryEvent('inquiry_file_removed', {
        formVariant,
        sourcePage,
        route: routeLabel,
        fileCategory: fileCategory(item.name),
      })
      // Best-effort server cleanup for a not-yet-submitted upload.
      if (item.attachmentId && (item.phase === 'complete' || item.phase === 'scanning')) {
        await fetch(
          `/api/inquiries/uploads/${item.attachmentId}?submissionId=${encodeURIComponent(submissionId)}`,
          { method: 'DELETE' },
        ).catch(() => {})
      }
    },
    [formVariant, sourcePage, routeLabel, submissionId],
  )

  const liveCount = items.filter((i) => i.phase !== 'rejected' && i.phase !== 'failed').length
  const full = liveCount >= limits.maxFiles

  return (
    <div>
      <label htmlFor={inputId} className="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">
        Supporting files{' '}
        <span className="font-normal text-[var(--brand-muted)]">(optional, up to {limits.maxFiles})</span>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!full && e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm transition-colors ${
          dragging
            ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/[0.06]'
            : 'border-[var(--brand-border)] bg-black/[0.02]'
        } ${full ? 'opacity-60' : ''}`}
      >
        <Paperclip className="h-5 w-5 text-[var(--brand-muted)]" />
        <div className="text-center text-[var(--brand-text)]">
          <button
            type="button"
            disabled={full}
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-[var(--brand-accent)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:no-underline"
          >
            Choose files
          </button>{' '}
          <span className="text-[var(--brand-muted)]">or drag them here</span>
        </div>
        <p className="text-xs text-[var(--brand-placeholder)]">
          PDF, DOC, DOCX, XLSX, CSV, PNG, JPG — max 10 MB each
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple={limits.maxFiles > 1}
          accept={UPLOAD_ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = '' // allow re-selecting the same file
          }}
        />
      </div>

      {notice && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> {notice}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.localId}
              className="flex items-center gap-3 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 text-sm"
            >
              <StatusIcon phase={item.phase} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[var(--brand-text)]">{item.name}</div>
                {/* Announce each file's phase transitions (uploading -> verifying
                    -> scanning -> uploaded) to assistive tech. */}
                <div className="text-xs text-[var(--brand-muted)]" role="status" aria-live="polite">
                  <StatusLabel item={item} />
                </div>
                {item.phase === 'uploading' && (
                  <div
                    className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/[0.06]"
                    role="progressbar"
                    aria-label={`Uploading ${item.name}`}
                    aria-valuenow={Math.round(item.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--brand-accent)] transition-[width]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => remove(item)}
                className="shrink-0 rounded-md p-1 text-[var(--brand-muted)] hover:bg-black/[0.05] hover:text-[var(--brand-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusIcon({ phase }: { phase: Phase }) {
  if (phase === 'complete') return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
  if (phase === 'rejected' || phase === 'failed')
    return <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
  if (phase === 'scanning')
    return <ShieldCheck className="h-4 w-4 shrink-0 animate-pulse text-[var(--brand-accent)]" />
  return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--brand-accent)]" />
}

function StatusLabel({ item }: { item: Item }) {
  switch (item.phase) {
    case 'authorizing':
      return <>Preparing…</>
    case 'uploading':
      return <>Uploading… {item.progress}%</>
    case 'scanning':
      return <>Scanning for malware…</>
    case 'complete':
      return <span className="text-green-700">Ready to send</span>
    case 'rejected':
    case 'failed':
      return <span className="text-red-600">{item.error}</span>
  }
}
