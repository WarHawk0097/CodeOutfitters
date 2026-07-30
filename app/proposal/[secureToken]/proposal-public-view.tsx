// The public proposal experience, demo plane.
//
// Everything on this screen comes from the token in the address bar. There is no other input:
// no proposal id, no workspace, no account, no query parameter that changes what is rendered.
// A reader cannot walk from their proposal to anybody else's, because the page has no way to
// address a second one.
//
// What this screen never shows, and the reason each is absent:
//   the internal proposal id      it is an enumerable handle to a record
//   the recipient's email         the person reading already knows it; a forwarder should not
//   internal validation           the send gate is workspace business
//   internal notes and activity   written for colleagues, not for the client
//   why a link was revoked        "no longer active" is the whole truth a client needs
//
// Demo plane: every response is written to this browser's session store and nowhere else. The
// screen says so where the person clicking can read it, because a client who believes they
// have formally accepted a contract when nothing left the page has been misled.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_NOW } from '@/lib/demo/seed'
import { useDemoState } from '@/lib/demo/store'
import { demoPublicView } from '@/lib/demo/proposal-access'
import { recordProposalOpen, submitProposalResponse } from '@/lib/demo/actions'
import {
  ACCEPTANCE_AUTHORISATION_LABEL,
  ACCEPTANCE_RECORD_NOTICE,
  DECLINE_CONFIRMATION_LABEL,
  MAX_MESSAGE_LENGTH,
  MAX_NOTE_LENGTH,
  grantsContentAccess,
  sectionAnchors,
  validateResponseDraft,
  type ResponseDraft,
} from '@/lib/proposals/access/model'
import { PUBLIC_RESPONSE_REJECTION_MESSAGES } from '@/lib/proposals/access/provider'
import { PublicBlock, PublicNotice, PublicShell, publicDayLabel } from './public-chrome'

type Tab = ResponseDraft['type']

const TABS: { id: Tab; label: string }[] = [
  { id: 'question', label: 'Ask a question' },
  { id: 'comment', label: 'Leave a comment' },
  { id: 'acceptance', label: 'Accept' },
  { id: 'decline', label: 'Decline' },
]

/** The demo record of what happened, stated plainly. Nothing on this page emails anybody,
 *  notifies anybody, or signs anything. */
const DEMO_SAVE_NOTICE =
  'Saved in browser. This is a demonstration: nothing was sent to CodeOutfitters and no email was delivered.'

export function ProposalPublicView({ token }: { token: string }) {
  const state = useDemoState()
  const view = useMemo(() => demoPublicView(state, token, DEMO_NOW), [state, token])

  // One open per reader session. A reload, a prefetch or a second tab must not inflate the
  // count, or "opened 4 times" stops meaning anything to the person reading it in the
  // workspace. The marker is keyed by the token, which is already in the address bar, so
  // storing it adds no exposure that the URL did not already create.
  const recorded = useRef(false)
  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    const key = `cc-proposal-open:${token}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, DEMO_NOW)
    } catch {
      // Storage blocked. Recording the open once per mount is the honest fallback: better a
      // slightly high count than a proposal that looks unread because a browser said no.
    }
    recordProposalOpen(token)
  }, [token])

  if (!grantsContentAccess(view.state) || !view.document) {
    return <PublicNotice heading={view.heading} detail={view.detail} />
  }

  return (
    <PublicShell>
      <ProposalDocument token={token} view={view} />
    </PublicShell>
  )
}

type ViewModel = ReturnType<typeof demoPublicView>

function ProposalDocument({ token, view }: { token: string; view: ViewModel }) {
  const snapshot = view.document!
  const anchors = useMemo(() => sectionAnchors(snapshot), [snapshot])

  return (
    <>
      <header className="pp-head">
        <p className="pp-eyebrow">Prepared for {snapshot.clientOrganisation}</p>
        <h1>{snapshot.title}</h1>
        <p className="pp-sub">
          {view.recipientName ? `${view.recipientName} · ` : ''}
          Version {snapshot.versionLabel}
          {view.expiresAt ? ` · Available until ${publicDayLabel(view.expiresAt)}` : ''}
        </p>
        <p className="pp-state">{view.detail}</p>
        {view.newerVersionAvailable ? (
          <p className="pp-flag">
            A newer version of this proposal exists. Contact the person who sent this link for
            the current version.
          </p>
        ) : null}
        <button type="button" className="pp-print" onClick={() => window.print()}>
          Print this page
        </button>
        {/* Print styling, not a generated document. Saying "download PDF" here would promise
            a file this release does not produce. */}
        <p className="pp-fine">
          This page is formatted for printing from your browser. It is not a generated PDF
          document.
        </p>
      </header>

      {anchors.length > 1 ? (
        <nav className="pp-nav" aria-label="Proposal sections">
          <ol>
            {snapshot.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.navLabel}</a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <article className="pp-doc">
        {snapshot.sections.map((section) => (
          <section key={section.id} id={section.id} aria-label={section.navLabel}>
            {section.blocks.map((block, index) => (
              <PublicBlock key={index} block={block} />
            ))}
          </section>
        ))}
      </article>

      {view.decision ? <DecisionRecord decision={view.decision} /> : null}
      {view.responses.length > 0 ? <ResponseHistory responses={view.responses} /> : null}
      {view.canRespond ? <ResponseForm token={token} /> : null}

      <style>{`
        .pp-head h1 { font-family: var(--font-display); font-size: clamp(24px, 4.5vw, 34px); line-height: 1.15; letter-spacing: -.025em; margin: 6px 0 0; }
        .pp-eyebrow { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--brand-muted); margin: 0; }
        .pp-sub { margin: 10px 0 0; font-size: 14px; color: var(--brand-muted); }
        .pp-state { margin: 14px 0 0; font-size: 14px; line-height: 1.6; }
        .pp-flag { margin: 10px 0 0; padding: 10px 12px; border-left: 3px solid var(--brand-gold); background: var(--brand-surface-2); font-size: 13.5px; line-height: 1.55; }
        .pp-print { margin: 16px 0 0; padding: 9px 16px; border-radius: 999px; border: 1px solid var(--brand-border); background: var(--brand-surface); font: inherit; font-size: 13.5px; cursor: pointer; }
        .pp-print:hover { background: var(--brand-surface-2); }
        .pp-fine { margin: 8px 0 0; font-size: 12px; color: var(--brand-muted); }
        .pp-nav { margin: 28px 0 0; padding: 14px 16px; border: 1px solid var(--brand-border); border-radius: 12px; background: var(--brand-surface); }
        .pp-nav ol { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px 18px; }
        .pp-nav a { font-size: 13px; color: var(--brand-emerald); text-decoration: none; }
        .pp-nav a:hover, .pp-nav a:focus-visible { text-decoration: underline; }
        .pp-doc { margin: 24px 0 0; }
        .pp-doc > section { padding: 24px; margin: 0 0 16px; background: var(--brand-surface); border: 1px solid var(--brand-border); border-radius: 14px; scroll-margin-top: 16px; }
        .pp-doc h2 { font-family: var(--font-display); font-size: 20px; line-height: 1.25; letter-spacing: -.02em; margin: 4px 0 0; }
        .pp-p { margin: 12px 0 0; font-size: 15px; line-height: 1.75; }
        .pp-stat { display: block; margin: 16px 0 0; border-top: 2px solid var(--brand-emerald); padding-top: 8px; }
        .pp-stat-v { display: block; font-family: var(--font-mono); font-size: 22px; font-weight: 600; color: var(--brand-emerald); }
        .pp-stat-l { display: block; font-size: 12px; color: var(--brand-muted); }
        .pp-card { margin: 14px 0 0; padding: 14px; border: 1px solid var(--brand-border); border-radius: 12px; background: var(--brand-surface-2); }
        .pp-card strong { font-size: 14px; }
        .pp-card p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.6; color: var(--brand-muted); }
        .pp-compare { display: grid; gap: 12px; margin: 16px 0 0; }
        .pp-compare > div { padding: 14px; border: 1px solid var(--brand-border); border-radius: 12px; }
        .pp-compare p { margin: 6px 0 0; font-size: 13.5px; line-height: 1.6; }
        .pp-flow { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 0; padding: 0; list-style: none; }
        .pp-flow li { flex: 1 1 160px; padding: 12px; border: 1px solid var(--brand-border); border-radius: 12px; }
        .pp-flow strong { display: block; font-size: 13.5px; }
        .pp-flow span { display: block; margin-top: 4px; font-size: 12px; color: var(--brand-muted); }
        .pp-table { width: 100%; border-collapse: collapse; margin: 18px 0 0; text-align: left; }
        .pp-table caption { text-align: left; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--brand-muted); padding-bottom: 6px; }
        .pp-table th, .pp-table td { padding: 10px 0; border-bottom: 1px solid var(--brand-border); font-size: 14px; vertical-align: top; }
        .pp-table td { text-align: right; font-family: var(--font-mono); }
        .pp-table th span { font-weight: 400; color: var(--brand-muted); }
        .pp-table .pp-when { text-align: left; font-size: 12px; color: var(--brand-muted); }
        .pp-table tfoot th, .pp-table tfoot td { border-bottom: none; padding-top: 14px; font-weight: 700; }
        .pp-kv { margin: 16px 0 0; }
        .pp-kv > div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--brand-border); }
        .pp-kv dt { font-family: var(--font-mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--brand-muted); margin: 0; }
        .pp-kv dd { margin: 0; font-size: 14px; }
        .pp-note { margin: 14px 0 0; padding: 10px 12px; border: 1px dashed var(--brand-border); border-radius: 10px; font-size: 12.5px; line-height: 1.6; color: var(--brand-muted); }
        @media (min-width: 640px) { .pp-compare { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .pp-doc > section { padding: 18px; } }
        @media print {
          .pp-nav, .pp-print, .pp-respond { display: none; }
          .pp-doc > section { border: none; border-radius: 0; padding: 0 0 18px; break-inside: avoid; }
        }
      `}</style>
    </>
  )
}

function DecisionRecord({ decision }: { decision: NonNullable<ViewModel['decision']> }) {
  return (
    <section className="pp-decision" aria-label="Recorded decision">
      <h2>{decision.kind === 'accepted' ? 'You accepted this proposal' : 'You declined this proposal'}</h2>
      <p>
        Recorded on {publicDayLabel(decision.at)}
        {decision.typedName ? ` in the name of ${decision.typedName}` : ''}.
      </p>
      {/* The same sentence the acceptance form showed, repeated after the fact. What was
          recorded does not quietly become something stronger once it is in the past. */}
      <p className="pp-fine">{ACCEPTANCE_RECORD_NOTICE}</p>
      <style>{`
        .pp-decision { margin: 24px 0 0; padding: 20px 24px; border: 1px solid var(--brand-border); border-left: 4px solid var(--brand-primary); border-radius: 14px; background: var(--brand-surface); }
        .pp-decision h2 { font-family: var(--font-display); font-size: 18px; margin: 0; letter-spacing: -.02em; }
        .pp-decision p { margin: 8px 0 0; font-size: 14px; line-height: 1.6; }
      `}</style>
    </section>
  )
}

function ResponseHistory({ responses }: { responses: ViewModel['responses'] }) {
  return (
    <section className="pp-history" aria-label="Your messages">
      <h2>Your messages</h2>
      <ol>
        {responses.map((response) => (
          <li key={response.id}>
            <p className="pp-eyebrow">
              {response.kind === 'question' ? 'Question' : 'Comment'} ·{' '}
              {publicDayLabel(response.submittedAt)} · {response.displayName}
            </p>
            <p>{response.message}</p>
          </li>
        ))}
      </ol>
      <style>{`
        .pp-history { margin: 24px 0 0; padding: 20px 24px; border: 1px solid var(--brand-border); border-radius: 14px; background: var(--brand-surface); }
        .pp-history h2 { font-family: var(--font-display); font-size: 18px; margin: 0 0 12px; letter-spacing: -.02em; }
        .pp-history ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
        .pp-history li { padding-left: 12px; border-left: 2px solid var(--brand-border); }
        .pp-history li p { margin: 4px 0 0; font-size: 14px; line-height: 1.6; }
      `}</style>
    </section>
  )
}

function ResponseForm({ token }: { token: string }) {
  const [tab, setTab] = useState<Tab>('question')
  const [message, setMessage] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [typedName, setTypedName] = useState('')
  const [authorised, setAuthorised] = useState(false)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')

  const draft: ResponseDraft =
    tab === 'question' || tab === 'comment'
      ? { type: tab, message, displayName }
      : tab === 'acceptance'
        ? { type: 'acceptance', typedName, authorised, note }
        : { type: 'decline', reason, confirmed }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    // Checked here for immediate feedback, and checked again inside the mutation. The form's
    // copy is a courtesy; the boundary is the one that decides.
    const found = validateResponseDraft(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setStatus('Please check the highlighted fields.')
      return
    }
    const result = submitProposalResponse(token, draft)
    if (!result.ok) {
      setStatus(PUBLIC_RESPONSE_REJECTION_MESSAGES[result.reason])
      return
    }
    setMessage('')
    setNote('')
    setReason('')
    setStatus(DEMO_SAVE_NOTICE)
  }

  const describedBy = (field: string) => (errors[field] ? `pp-err-${field}` : undefined)

  return (
    <section className="pp-respond" aria-labelledby="pp-respond-heading">
      <h2 id="pp-respond-heading">Respond to this proposal</h2>

      <div className="pp-tabs" role="group" aria-label="Response type">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={tab === entry.id}
            onClick={() => {
              setTab(entry.id)
              setErrors({})
              setStatus('')
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate>
        {tab === 'question' || tab === 'comment' ? (
          <>
            <label htmlFor="pp-message">
              {tab === 'question' ? 'Your question' : 'Your comment'}
            </label>
            <textarea
              id="pp-message"
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={describedBy('message')}
            />
            <FieldError id="pp-err-message" message={errors.message} />

            <label htmlFor="pp-display-name">Your name (optional)</label>
            <input
              id="pp-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={describedBy('displayName')}
            />
            <FieldError id="pp-err-displayName" message={errors.displayName} />
          </>
        ) : null}

        {tab === 'acceptance' ? (
          <>
            <p className="pp-fine">{ACCEPTANCE_RECORD_NOTICE}</p>

            <label htmlFor="pp-typed-name">Your full name</label>
            <input
              id="pp-typed-name"
              type="text"
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              aria-invalid={Boolean(errors.typedName)}
              aria-describedby={describedBy('typedName')}
            />
            <FieldError id="pp-err-typedName" message={errors.typedName} />

            <div className="pp-check">
              <input
                id="pp-authorised"
                type="checkbox"
                checked={authorised}
                onChange={(event) => setAuthorised(event.target.checked)}
                aria-invalid={Boolean(errors.authorised)}
                aria-describedby={describedBy('authorised')}
              />
              <label htmlFor="pp-authorised">{ACCEPTANCE_AUTHORISATION_LABEL}</label>
            </div>
            <FieldError id="pp-err-authorised" message={errors.authorised} />

            <label htmlFor="pp-note">Anything to add (optional)</label>
            <textarea
              id="pp-note"
              rows={3}
              maxLength={MAX_NOTE_LENGTH}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-invalid={Boolean(errors.note)}
              aria-describedby={describedBy('note')}
            />
            <FieldError id="pp-err-note" message={errors.note} />
          </>
        ) : null}

        {tab === 'decline' ? (
          <>
            <label htmlFor="pp-reason">Reason (optional)</label>
            <textarea
              id="pp-reason"
              rows={3}
              maxLength={MAX_NOTE_LENGTH}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={describedBy('reason')}
            />
            <FieldError id="pp-err-reason" message={errors.reason} />

            <div className="pp-check">
              <input
                id="pp-confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                aria-invalid={Boolean(errors.confirmed)}
                aria-describedby={describedBy('confirmed')}
              />
              <label htmlFor="pp-confirmed">{DECLINE_CONFIRMATION_LABEL}</label>
            </div>
            <FieldError id="pp-err-confirmed" message={errors.confirmed} />
          </>
        ) : null}

        <button type="submit" className="pp-submit">
          {tab === 'acceptance' ? 'Record acceptance' : tab === 'decline' ? 'Record decline' : 'Send'}
        </button>
      </form>

      <p className="pp-status" role="status" aria-live="polite">
        {status}
      </p>

      <style>{`
        .pp-respond { margin: 24px 0 0; padding: 22px 24px 26px; border: 1px solid var(--brand-border); border-radius: 14px; background: var(--brand-surface); }
        .pp-respond h2 { font-family: var(--font-display); font-size: 18px; margin: 0; letter-spacing: -.02em; }
        .pp-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 18px; }
        .pp-tabs button { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--brand-border); background: var(--brand-surface-2); font: inherit; font-size: 13.5px; cursor: pointer; }
        .pp-tabs button[aria-pressed='true'] { background: var(--brand-emerald); border-color: var(--brand-emerald); color: #fff; }
        .pp-respond label { display: block; margin: 14px 0 6px; font-size: 13.5px; font-weight: 600; }
        .pp-respond input[type='text'], .pp-respond textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--brand-border); border-radius: 10px; background: var(--brand-surface-2); font: inherit; font-size: 14.5px; }
        .pp-respond textarea { resize: vertical; }
        .pp-respond input:focus-visible, .pp-respond textarea:focus-visible, .pp-tabs button:focus-visible, .pp-submit:focus-visible { outline: 2px solid var(--brand-focus); outline-offset: 2px; }
        .pp-check { display: flex; align-items: flex-start; gap: 10px; margin: 14px 0 0; }
        .pp-check input { margin-top: 3px; }
        .pp-check label { margin: 0; font-weight: 400; font-size: 14px; line-height: 1.5; }
        .pp-err { margin: 6px 0 0; font-size: 13px; color: #9B1C1C; }
        .pp-submit { margin: 20px 0 0; padding: 11px 22px; border: none; border-radius: 999px; background: var(--brand-green-solid); color: #fff; font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; }
        .pp-status { margin: 14px 0 0; font-size: 13.5px; line-height: 1.6; color: var(--brand-muted); min-height: 1.6em; }
      `}</style>
    </section>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p className="pp-err" id={id}>
      {message}
    </p>
  )
}
