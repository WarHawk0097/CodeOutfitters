'use client'

// Shared form engine hook (spec §5). Every inquiry placement — popup, compact
// Services/Industries forms, full Contact flow, contextual CTAs — runs on this
// one hook so validation, honeypot handling, idempotent submission, error
// mapping, and privacy-safe analytics live in exactly one place. Presentation
// is entirely the caller's; this hook is headless.
import { useCallback, useRef, useState } from 'react'
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import type { FormVariant, InquirySubmissionResponse } from '@/lib/inquiry/inquiry-schema'
import {
  buildInquiryRequest,
  type InquiryFormValues,
} from '@/lib/inquiry/inquiry-form-values'
import {
  buildSourceContext,
  type BuildSourceContextInput,
} from '@/lib/inquiry/inquiry-source-context'
import { submitInquiry } from '@/lib/inquiry/inquiry-api-client'
import { trackInquiryEvent } from '@/lib/inquiry/inquiry-analytics'

export type InquirySubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export type UseInquiryFormOptions<TValues extends FieldValues> = {
  schema: z.ZodType<TValues>
  formVariant: FormVariant
  defaultValues: DefaultValues<TValues>
  // Static attribution input the placement knows at render (page name, selected
  // service/industry/case study). The live URL/campaign/viewport is read from
  // `window` at submit time by buildSourceContext.
  sourceInput: BuildSourceContextInput
  onSuccess?: (response: InquirySubmissionResponse) => void
}

export type UseInquiryFormResult<TValues extends FieldValues> = {
  form: UseFormReturn<TValues>
  status: InquirySubmitStatus
  errorMessage: string | null
  response: InquirySubmissionResponse | null
  submissionId: string
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  // Honeypot: bind to a visually-hidden input. A filled value means a bot; the
  // form fakes success and never touches the network (existing site convention).
  honeypot: { value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }
  // Call once when the user first interacts, to emit inquiry_form_started.
  markStarted: () => void
}

function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // ponytail: only hit outside a secure context / old runtime; RFC4122-ish.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useInquiryForm<TValues extends FieldValues>(
  options: UseInquiryFormOptions<TValues>,
): UseInquiryFormResult<TValues> {
  const form = useForm<TValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rhf/zod resolver generics don't unify with a runtime z.ZodType<TValues>; the schema and TValues are the same shape by construction.
    resolver: zodResolver(options.schema as any),
    defaultValues: options.defaultValues,
    mode: 'onBlur',
  })

  const [status, setStatus] = useState<InquirySubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [response, setResponse] = useState<InquirySubmissionResponse | null>(null)
  const [honeypotValue, setHoneypotValue] = useState('')

  // Stable across retries so a re-submit is an idempotent replay, not a new
  // lead (spec §9.6). Regenerated only after a fresh success.
  const submissionIdRef = useRef<string>(newSubmissionId())
  const startedRef = useRef(false)

  const { formVariant, sourceInput } = options
  const sourcePage = sourceInput.pageName

  const markStarted = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    trackInquiryEvent('inquiry_form_started', { formVariant, sourcePage })
  }, [formVariant, sourcePage])

  const submit = form.handleSubmit(async (values) => {
    // Honeypot tripped: silently succeed, never hit the network.
    if (honeypotValue) {
      setStatus('success')
      return
    }

    setStatus('submitting')
    setErrorMessage(null)
    trackInquiryEvent('inquiry_submit_attempted', { formVariant, sourcePage })

    const request = buildInquiryRequest({
      submissionId: submissionIdRef.current,
      formVariant,
      values: values as unknown as InquiryFormValues,
      source: buildSourceContext(sourceInput),
    })

    const result = await submitInquiry(request)

    if (result.ok) {
      setResponse(result)
      setStatus('success')
      submissionIdRef.current = newSubmissionId() // next submission is a new lead
      trackInquiryEvent('inquiry_submit_succeeded', { formVariant, sourcePage })
      options.onSuccess?.(result)
      return
    }

    // Field-level validation errors map back onto inputs (spec §9.15).
    if (result.error.code === 'validation' && result.error.fields) {
      for (const [field, message] of Object.entries(result.error.fields)) {
        form.setError(field as Path<TValues>, { type: 'server', message })
      }
    }
    setErrorMessage(result.error.message)
    setStatus('error')
    trackInquiryEvent('inquiry_submit_failed', {
      formVariant,
      sourcePage,
      errorCode: result.error.code,
    })
  })

  const onSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      await submit(event)
    },
    [submit],
  )

  return {
    form,
    status,
    errorMessage,
    response,
    submissionId: submissionIdRef.current,
    onSubmit,
    honeypot: {
      value: honeypotValue,
      onChange: (event) => setHoneypotValue(event.target.value),
    },
    markStarted,
  }
}
