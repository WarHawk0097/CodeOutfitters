// Security 5 (this change): the client-side password gate is removed, not
// refactored. It compared a public build-time env var (inlined into the
// browser bundle) against a value the client itself wrote to its own browser
// storage — neither is a real boundary, and anyone reading the bundle could
// set that same key and pass. See docs/SECURITY.md R-001.
//
// There is no in-app administrator identity this tool can check against: the
// only role model in this repo is the per-workspace owner/admin/member rank
// in lib/dashboard/roles.ts, which answers "what can this client do in their
// own workspace," not "is this person CodeOutfitters staff." Inventing a new
// admin-role schema for a single-operator internal tool isn't warranted, and
// the Cloudflare Access boundary this file used to point to is configured
// outside this repo (Cloudflare dashboard) and is never verified by any code
// here — so it can't be relied on as the app's own enforcement.
//
// So the boundary lives here instead, and it's the simplest one available:
// this whole surface renders only inside `next dev`. NODE_ENV is not
// 'development' in any built/deployed app (production or preview), it can't
// be set by a request, and this check runs on the server before any admin
// child component renders — so no admin markup, script, or data ever reaches
// a production response.
import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (process.env.NODE_ENV !== 'development') notFound()

  return (
    <div className="min-h-screen bg-[#1C1612]">
      <AdminHeader />
      <main>{children}</main>
    </div>
  )
}
