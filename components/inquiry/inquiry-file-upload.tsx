'use client'

// Supporting-files step — INERT in Work Order D (spec §11). Secure private
// storage is not connected yet (Work Order E), so this step deliberately opens
// no file picker, selects no files, issues no attachment tokens, and never
// implies a file reached the server. It renders a disabled, clearly-labelled
// placeholder so the six-stage Contact journey stays intact without misleading
// the visitor. Activation (real upload endpoint + tokens) is Work Order E.
import { Paperclip } from 'lucide-react'
import { MAX_FILES } from '@/lib/inquiry/inquiry-upload-validation'
import type { FormVariant } from '@/lib/inquiry/inquiry-schema'

export function InquiryFileUpload({
  // Props kept for a stable call site; nothing is emitted while inert.
  formVariant: _formVariant,
  sourcePage: _sourcePage,
  onFilesChange: _onFilesChange,
}: {
  formVariant: FormVariant
  sourcePage: string
  onFilesChange?: (files: File[]) => void
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">
        Supporting files <span className="font-normal text-[var(--brand-muted)]">(coming soon)</span>
      </label>

      <div
        aria-disabled="true"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--brand-border)] bg-black/[0.03] px-4 py-3 text-sm text-[var(--brand-placeholder)]"
      >
        <Paperclip className="h-4 w-4" />
        Supporting-file uploads will be enabled when secure storage is connected
      </div>

      <p className="mt-2 text-xs text-[var(--brand-placeholder)]">
        We are wiring up secure, private file delivery — up to {MAX_FILES} files
        will attach here once it is live. For anything urgent in the meantime,
        email hello@codeoutfitters.com and we will follow up.
      </p>
    </div>
  )
}
