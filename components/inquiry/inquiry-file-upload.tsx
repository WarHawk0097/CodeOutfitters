'use client'

// Prepared attachment picker (spec §11) — NOT ACTIVATED in Work Order D. Files
// are validated and listed client-side but NEVER uploaded: no network call, no
// token, and the UI never claims a file was "uploaded". It selects and holds
// File objects in memory only; attachmentTokens stays empty on the wire.
// Activation (real upload endpoint + tokens) is Work Order E.
import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  validateFiles,
  type RejectedFile,
} from '@/lib/inquiry/inquiry-upload-validation'
import { trackInquiryEvent } from '@/lib/inquiry/inquiry-analytics'
import type { FormVariant } from '@/lib/inquiry/inquiry-schema'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')

export function InquiryFileUpload({
  formVariant,
  sourcePage,
  onFilesChange,
}: {
  formVariant: FormVariant
  sourcePage: string
  onFilesChange?: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState<RejectedFile[]>([])

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files ? Array.from(event.target.files) : []
    const { accepted, rejected: bad } = validateFiles(chosen, files)
    const next = [...files, ...accepted]
    setFiles(next)
    setRejected(bad)
    onFilesChange?.(next)
    if (accepted.length > 0) {
      // Count + aggregate size only — never filenames (spec §19).
      trackInquiryEvent('inquiry_file_selected', {
        formVariant,
        sourcePage,
        fileCount: next.length,
        totalFileBytes: next.reduce((sum, f) => sum + f.size, 0),
      })
    }
    event.target.value = '' // allow re-selecting the same file
  }

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    onFilesChange?.(next)
  }

  return (
    <div>
      <label className="block text-[13px] font-semibold text-[var(--brand-text)] mb-1.5">
        Supporting files <span className="font-normal text-[var(--brand-muted)]">(optional)</span>
      </label>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--brand-border)] bg-white px-4 py-3 text-sm text-[var(--brand-muted)] transition-colors hover:border-[var(--brand-green)]"
      >
        <Paperclip className="h-4 w-4" />
        Add files ({ALLOWED_EXTENSIONS.join(', ')})
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={handleSelect}
        className="hidden"
        aria-label="Add supporting files"
      />

      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-[var(--brand-text)]"
            >
              <span className="truncate">{file.name}</span>
              <span className="ml-2 flex items-center gap-2 text-[var(--brand-muted)]">
                {formatBytes(file.size)}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${file.name}`}
                  className="rounded p-0.5 hover:bg-black/5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1" role="alert">
          {rejected.map((item, index) => (
            <li key={`${item.name}-${index}`} className="text-xs text-red-500">
              {item.name}: {item.reason}
            </li>
          ))}
        </ul>
      )}

      {/* Honesty note (spec §11 / Work Order D): uploads are not live yet. */}
      <p className="mt-2 text-xs text-[var(--brand-placeholder)]">
        Attachments stay on your device for now. File delivery goes live soon; for
        anything urgent, email hello@codeoutfitters.com. Up to {MAX_FILES} files.
      </p>
    </div>
  )
}
