// Shared chrome for the public proposal route.
//
// Server-renderable on purpose — no "use client" — so a status page (unavailable, expired,
// revoked, not found) renders without shipping a single byte of interactive JavaScript to a
// reader who has nothing to interact with.
//
// This is a client-facing surface, so it wears the CodeOutfitters brand tokens from
// app/globals.css rather than the dashboard's `cc-*` palette: it is the last thing a prospect
// sees before deciding, and it should not look like somebody's internal tool.
//
// What is deliberately absent from every screen here: the workspace name beyond the brand,
// the internal proposal id, the recipient's email address, internal validation, internal
// notes, any analytics or marketing tag, and any third-party script.
import type { ReactNode } from 'react'
import type { DocBlock } from '@/lib/command-center/proposals/model'
import { formatUsd } from '@/lib/command-center/proposals/money'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "18 May 2026" from an ISO instant, by slicing the string.
 *
 *  Not toLocaleDateString and not a Date at all: this text is rendered on the server and again
 *  in the reader's browser, and a formatter that consults the runtime's timezone produces two
 *  different days either side of midnight UTC. A hydration mismatch on a date is how a client
 *  ends up being told their proposal expired a day early. */
export function publicDayLabel(iso: string): string {
  const day = Number(iso.slice(8, 10))
  const month = MONTHS[Number(iso.slice(5, 7)) - 1]
  const year = iso.slice(0, 4)
  return month ? `${day} ${month} ${year}` : year
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="pp-root">
      <header className="pp-bar">
        <span className="pp-logo">
          Code<b>Outfitters</b>
        </span>
      </header>
      <main className="pp-main">{children}</main>
      <footer className="pp-foot">
        <p>Shared with you through a private link. Please do not forward it.</p>
      </footer>
      <style>{`
        .pp-root { min-height: 100dvh; display: flex; flex-direction: column; background: var(--brand-bg); color: var(--brand-text); }
        .pp-bar { padding: 18px 24px; border-bottom: 1px solid var(--brand-border); background: var(--brand-surface); }
        .pp-logo { font-family: var(--font-display); font-size: 17px; letter-spacing: -.02em; }
        .pp-logo b { color: var(--brand-primary); font-weight: 700; }
        .pp-main { flex: 1; width: 100%; max-width: 900px; margin: 0 auto; padding: 28px 20px 56px; }
        .pp-foot { border-top: 1px solid var(--brand-border); padding: 18px 24px 28px; }
        .pp-foot p { max-width: 900px; margin: 0 auto; font-size: 12.5px; color: var(--brand-muted); }
        @media (max-width: 640px) { .pp-main { padding: 20px 16px 40px; } }
        @media print {
          .pp-bar, .pp-foot { display: none; }
          .pp-root { background: #fff; }
          .pp-main { max-width: none; padding: 0; }
        }
      `}</style>
    </div>
  )
}

/** A status page: a heading, a sentence, and nothing else.
 *
 *  Every state that does not grant access renders through this one component, so an expired
 *  link, a revoked link and a token that never existed produce the same shape of page. The
 *  only difference is the sentence, and none of the sentences say whether a proposal exists. */
export function PublicNotice({ heading, detail }: { heading: string; detail: string }) {
  return (
    <PublicShell>
      <section className="pp-notice" aria-labelledby="pp-notice-heading">
        <h1 id="pp-notice-heading">{heading}</h1>
        <p>{detail}</p>
      </section>
      <style>{`
        .pp-notice { max-width: 560px; margin: 48px auto; background: var(--brand-surface); border: 1px solid var(--brand-border); border-radius: 14px; padding: 28px; }
        .pp-notice h1 { font-family: var(--font-display); font-size: 22px; line-height: 1.25; letter-spacing: -.02em; margin: 0; }
        .pp-notice p { margin: 12px 0 0; font-size: 14.5px; line-height: 1.65; color: var(--brand-muted); }
      `}</style>
    </PublicShell>
  )
}

/** Render one block of a published proposal.
 *
 *  Text only, always. Every field is rendered as text through JSX — never as markup, never
 *  through dangerouslySetInnerHTML — so a proposal body cannot carry script onto a page that
 *  a client opens from an email. */
export function PublicBlock({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case 'heading':
      return (
        <div className="pp-h">
          {block.eyebrow ? <span className="pp-eyebrow">{block.eyebrow}</span> : null}
          {block.title ? <h2>{block.title}</h2> : null}
        </div>
      )
    case 'paragraph':
      return <p className="pp-p">{block.text}</p>
    case 'stat':
      return (
        <div className="pp-stat">
          <span className="pp-stat-v">{block.value}</span>
          <span className="pp-stat-l">{block.label}</span>
        </div>
      )
    case 'card':
      return (
        <div className="pp-card">
          <strong>{block.title}</strong>
          <p>{block.body}</p>
        </div>
      )
    case 'compare':
      return (
        <div className="pp-compare">
          <div>
            <span className="pp-eyebrow">Today</span>
            <p>{block.today}</p>
          </div>
          <div>
            <span className="pp-eyebrow">With CodeOutfitters</span>
            <p>{block.withUs}</p>
          </div>
        </div>
      )
    case 'flow':
      return (
        <ol className="pp-flow">
          {block.steps.map((step, index) => (
            <li key={index}>
              <strong>{step.label}</strong>
              <span>{step.hint}</span>
            </li>
          ))}
        </ol>
      )
    case 'pricingTable':
      return (
        <table className="pp-table">
          <caption>Investment</caption>
          <tbody>
            {block.lines.map((line) => (
              <tr key={line.id}>
                <th scope="row">
                  {line.name} <span>· {line.detail}</span>
                </th>
                <td>{formatUsd(line.cents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{block.totalLabel}</th>
              <td>{formatUsd(block.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
      )
    case 'milestoneTable':
      return (
        <table className="pp-table">
          <caption>Delivery milestones</caption>
          <tbody>
            {block.milestones.map((milestone) => (
              <tr key={milestone.id}>
                <td className="pp-when">{milestone.timing}</td>
                <th scope="row">{milestone.name}</th>
                <td>payment {milestone.paymentPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'keyValue':
      return (
        <dl className="pp-kv">
          {block.rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )
    case 'note':
      return <p className="pp-note">{block.text}</p>
    default: {
      // Exhaustiveness guard — every DocBlock kind is handled above.
      const never: never = block
      return never
    }
  }
}
