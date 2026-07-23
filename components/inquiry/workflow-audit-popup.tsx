'use client'

// Global workflow-audit popup (spec §7). Auto-shows once per eligible visitor
// via engagement timer / 50% scroll / desktop exit-intent, and can be opened
// manually from anywhere by dispatching the `OPEN_WORKFLOW_AUDIT_EVENT`.
// Desktop renders a centered Dialog; mobile renders a bottom Drawer. Motion is
// GSAP (spec §17), disabled under reduced-motion. Suppression + storage live in
// lib/inquiry/inquiry-popup-suppression (its OWN storage key, zero inquiry
// details). a11y: focus trap, Escape, focus restoration, locked background
// scroll, explicit close button.
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { gsap } from 'gsap'
import type { BuildSourceContextInput } from '@/lib/inquiry/inquiry-source-context'
import type { FormVariant } from '@/lib/inquiry/inquiry-schema'
import {
  canAutoShowPopup,
  markAutoDisplayed,
  markDismissed,
  markSubmitted,
} from '@/lib/inquiry/inquiry-popup-suppression'
import { trackInquiryEvent } from '@/lib/inquiry/inquiry-analytics'
import { CompactInquiryForm, type ContextFieldKey } from './compact-inquiry-form'

// Any CTA can open the popup by dispatching this event on window.
export const OPEN_WORKFLOW_AUDIT_EVENT = 'open-workflow-audit'

// A contextual manual open (e.g. a case-study CTA) carries its own placement,
// source attribution and copy so the shared popup renders as that placement
// instead of the default global popup.
export type InquiryPopupContext = {
  formVariant: FormVariant
  sourceInput: BuildSourceContextInput
  heading?: string
  description?: string
  descriptionLabel?: string
  descriptionPlaceholder?: string
  submitLabel?: string
  contextKey?: ContextFieldKey
  contextLabel?: string
  contextPlaceholder?: string
}

// Open the shared popup from anywhere. With no argument it opens the default
// global popup; with a context it opens as that contextual placement.
export function openInquiryPopup(context?: InquiryPopupContext): void {
  window.dispatchEvent(new CustomEvent(OPEN_WORKFLOW_AUDIT_EVENT, { detail: context ?? null }))
}

const ENGAGEMENT_DELAY_MS = 25_000
const SCROLL_TRIGGER_RATIO = 0.5
const SOURCE_PAGE = 'Global popup'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (document.documentElement.getAttribute('data-motion') === 'reduced') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])'

export function WorkflowAuditPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Non-null when opened by a contextual CTA; null = default global popup.
  const [context, setContext] = useState<InquiryPopupContext | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const openedOnceRef = useRef(false)

  const activeFormVariant = context?.formVariant ?? 'global_popup'
  const activeSourceInput: BuildSourceContextInput = context?.sourceInput ?? {
    formVariant: 'global_popup',
    pageName: SOURCE_PAGE,
  }

  const openPopup = useCallback(
    (auto: boolean, nextContext: InquiryPopupContext | null = null) => {
      if (openedOnceRef.current && auto) return
      openedOnceRef.current = true
      if (auto) markAutoDisplayed(Date.now())
      setContext(nextContext)
      restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null
      setOpen(true)
      trackInquiryEvent('inquiry_popup_opened', {
        formVariant: nextContext?.formVariant ?? 'global_popup',
        sourcePage: nextContext?.sourceInput.pageName ?? SOURCE_PAGE,
      })
    },
    [],
  )

  const closePopup = useCallback(
    (dismissed: boolean) => {
      if (dismissed) {
        markDismissed(Date.now())
        trackInquiryEvent('inquiry_popup_dismissed', {
          formVariant: 'global_popup',
          sourcePage: SOURCE_PAGE,
        })
      }
      const finish = () => {
        setOpen(false)
        restoreFocusRef.current?.focus?.()
      }
      const panel = panelRef.current
      if (panel && !prefersReducedMotion()) {
        gsap.to(panel, {
          opacity: 0,
          y: 16,
          scale: 0.98,
          duration: 0.18, // exit shorter than enter (spec §17)
          ease: 'power2.in',
          onComplete: finish,
        })
      } else {
        finish()
      }
    },
    [],
  )

  // Manual-open listener: CTAs dispatch OPEN_WORKFLOW_AUDIT_EVENT. Manual opens
  // bypass suppression (spec §7 "manual CTAs stay available").
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<InquiryPopupContext | null>).detail ?? null
      openPopup(false, detail)
    }
    window.addEventListener(OPEN_WORKFLOW_AUDIT_EVENT, handler)
    return () => window.removeEventListener(OPEN_WORKFLOW_AUDIT_EVENT, handler)
  }, [openPopup])

  // Auto-trigger wiring (engagement timer / 50% scroll / desktop exit-intent).
  useEffect(() => {
    if (!canAutoShowPopup({ pathname, now: Date.now() })) return

    let engagementTimer: ReturnType<typeof setTimeout> | null = null
    let scrollScheduled = false

    const fire = () => {
      if (!canAutoShowPopup({ pathname, now: Date.now() })) return
      trackInquiryEvent('inquiry_popup_eligible', {
        formVariant: 'global_popup',
        sourcePage: SOURCE_PAGE,
      })
      cleanup()
      openPopup(true)
    }

    const startEngagementTimer = () => {
      if (engagementTimer) return
      engagementTimer = setTimeout(fire, ENGAGEMENT_DELAY_MS)
    }

    const onScroll = () => {
      if (scrollScheduled) return
      scrollScheduled = true
      requestAnimationFrame(() => {
        scrollScheduled = false
        startEngagementTimer()
        const scrolled = window.scrollY + window.innerHeight
        const ratio = scrolled / document.documentElement.scrollHeight
        if (ratio >= SCROLL_TRIGGER_RATIO) fire()
      })
    }

    const onExitIntent = (event: MouseEvent) => {
      if (window.innerWidth < 1024) return // desktop only
      if (event.clientY <= 0 && !event.relatedTarget) fire()
    }

    const onEngage = () => startEngagementTimer()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onEngage, { passive: true, once: true })
    window.addEventListener('keydown', onEngage, { once: true })
    document.addEventListener('mouseout', onExitIntent)

    function cleanup() {
      if (engagementTimer) clearTimeout(engagementTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onEngage)
      window.removeEventListener('keydown', onEngage)
      document.removeEventListener('mouseout', onExitIntent)
    }

    return cleanup
  }, [pathname, openPopup])

  // Open side-effects: lock scroll, GSAP entrance, focus trap, Escape.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion()) {
        gsap.from(panel, {
          opacity: 0,
          y: 20,
          scale: 0.97,
          duration: 0.32,
          ease: 'power3.out',
        })
        gsap.from(panel.querySelectorAll('[data-stagger]'), {
          opacity: 0,
          y: 10,
          duration: 0.3,
          stagger: 0.05,
          delay: 0.08,
          ease: 'power2.out',
        })
      }
    }, panel)

    const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    focusables[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePopup(true)
        return
      }
      if (event.key !== 'Tab') return
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      ctx.revert()
    }
  }, [open, closePopup])

  const onSuccess = useCallback(() => {
    markSubmitted() // never auto-show again after a successful submit (spec §7)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => closePopup(true)}
        className="absolute inset-0 bg-[#0A120E]/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-audit-heading"
        aria-describedby="workflow-audit-desc"
        className="relative w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--brand-bg)] p-6 shadow-2xl max-h-[92dvh] sm:rounded-3xl sm:p-8"
      >
        <button
          type="button"
          onClick={() => closePopup(true)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-muted)] transition-colors hover:bg-black/5"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5" data-stagger>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-green)]">
            Free workflow audit
          </p>
          <h2
            id="workflow-audit-heading"
            className="font-display text-2xl font-semibold leading-tight text-[var(--brand-text)]"
          >
            {context?.heading ?? "What is eating your team's time?"}
          </h2>
          <p id="workflow-audit-desc" className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)]">
            {context?.description ??
              "Tell us where the manual work happens. We'll show you what can be automated and what is not worth automating."}
          </p>
        </div>

        <div data-stagger>
          <CompactInquiryForm
            key={activeFormVariant}
            formVariant={activeFormVariant}
            sourceInput={activeSourceInput}
            descriptionLabel={context?.descriptionLabel ?? 'What would you like to automate?'}
            descriptionPlaceholder={
              context?.descriptionPlaceholder ??
              'e.g. Every new lead from our site has to be copied into the CRM by hand.'
            }
            submitLabel={context?.submitLabel ?? 'Get my free workflow audit'}
            contextKey={context?.contextKey}
            contextLabel={context?.contextLabel}
            contextPlaceholder={context?.contextPlaceholder}
            onSuccess={onSuccess}
          />
        </div>

        <button
          type="button"
          onClick={() => closePopup(true)}
          className="mt-3 w-full text-center text-xs font-medium text-[var(--brand-placeholder)] hover:text-[var(--brand-muted)]"
        >
          Not right now
        </button>
      </div>
    </div>
  )
}
