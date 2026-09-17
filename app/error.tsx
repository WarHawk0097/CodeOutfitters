'use client'

// Catch-all error boundary for every route that does not define its own. Its
// one job: a server component failure must render a readable, honest page —
// never the framework's raw 500, never a stack trace, never internal detail.
// The digest (Next's opaque error id) is the only identifier shown, exactly so
// support can correlate a report with the server log without exposing
// anything else.
//
// This is a UI safety net, not an outage classifier: known auth-outage paths
// render their own explicit states before this boundary is ever reached.
import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Console only. No provider error text is rendered; the digest is opaque.
    console.error(error)
  }, [error])

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F2EA',
        color: '#0A120E',
        fontFamily: "'Instrument Sans', sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#FFFDF8',
          border: '1px solid #C9BEA8',
          borderRadius: 10,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, font: "600 24px/1.2 'Space Grotesk', sans-serif" }}>
          Something went wrong
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: '#4A5248' }}>
          This page could not be loaded. Please try again — if it keeps failing, the service
          may be temporarily unavailable.
        </p>
        {error?.digest ? (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#6B7369' }}>
            Reference: <code>{error.digest}</code>
          </p>
        ) : null}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              font: "600 14px 'Instrument Sans', sans-serif",
              color: '#F7F2EA',
              background: '#0E2A1D',
              border: 0,
              borderRadius: 10,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              font: "600 14px 'Instrument Sans', sans-serif",
              color: '#0E7A4E',
              textDecoration: 'none',
              alignSelf: 'center',
            }}
          >
            Back to the website
          </Link>
        </div>
      </div>
    </main>
  )
}
