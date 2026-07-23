# Command Center — Canonical Deviations

Deviations from the canonical design authority that are deliberate and understood.
Each is referenced by an ID from the code comment that introduces it.

---

## D-Q01 — Dashboard Lead-flow chart is store-derived, not KPI-consistent

**Where:** `apps/web/app/(shell)/dashboard/page.tsx`,
`apps/web/components/dashboard/lead-flow-chart.tsx`,
`apps/web/lib/dashboard/lead-flow.ts`.

**Canonical state.** The Overview KPI strip carries the design authority's own fixed
figures — **34 / 9 / 7 / 4** (New leads / Awaiting contact / Overdue follow-ups / …).
These are authored constants (`mocks/fixtures/overview-canonical.ts`); no dataset
produces them. The former Lead Flow region was a *static* SVG plot (`viewBox="0 0 1090
212"`, "35% recv→won") — decorative, not derived from any data.

**Deviation.** The static plot is replaced by `<LeadFlowChart/>`: an interactive recharts
area chart derived from the **shared demo lead store** — the same source every other
route reads, through the mock `/api/leads` endpoint, so demo mutations move the series.
Its two series (New leads by `createdAt`, Qualified leads by qualification instant) are
therefore **dataset-derived and will not equal the canonical KPI numbers beside them.**

**Why this is acceptable.** The task explicitly required the chart to derive from the
shared store and to update after mutations elsewhere; that is incompatible with pinning
it to authored KPI constants. The KPI strip stays canonical (unchanged). The chart's own
totals are self-consistent and are stated in an accessible text summary, so the chart is
never the sole source of its numbers. The KPI/chart mismatch is a difference of *source*
(authored vs derived), not an error.

**Consistency anchor that IS preserved.** The 7-day range's New-leads total equals the
Leads header's "new this week" count (`NEW_THIS_WEEK_COUNT = 12`) by construction — the
chart's rolling-24h bucketing matches `isNewThisWeek` exactly. Asserted in
`apps/web/lib/dashboard/lead-flow.test.ts`.

---

## D-Q02 — `qualifiedAt` is a chart metric, not a lead status

**Where:** `packages/contracts/src/leads.ts`,
`apps/web/mocks/fixtures/generate-leads.ts`, `apps/web/lib/dashboard/lead-flow.ts`.

**Canonical state.** There is no "Qualified" `LeadStatus` (it was removed 2026-07-22,
CLAIM-QUAL-001). The `LeadStatus` enum and `CANONICAL_LEAD_STATUS_ORDER` are unchanged.

**Deviation.** The chart's `qualifiedLeads` series needs a qualification *instant*. Two
additions, neither of which touches the status enum:

1. `QUALIFIED_STATUS_FLOOR = "Discovery Done"` + `isQualifiedStatus(status)` in contracts.
   "Qualified" = status at or beyond that floor in the canonical order. This is a
   **derived predicate over existing statuses**, not a new status value.
2. An optional `qualifiedAt: IsoDateTime` field on `Lead`, populated **deterministically**
   in the mock generator on exactly the leads that are qualified, as
   `min(REFERENCE_NOW, updatedAt)`. This draws **no new PRNG values**, so every other
   generated field (and thus every existing test fixture) is byte-for-byte unchanged. The
   two fixture tests that compare full rows strip `qualifiedAt` before comparing.

**Mock-data semantics (documented as required).**
- `qualifiedAt` is a **metric timestamp for the chart**, never a status transition and
  never surfaced in the UI as a status.
- It is set **iff** the lead's current status is qualified (`isQualifiedStatus`), so the
  count of rows carrying `qualifiedAt` equals the status-derived qualified count.
- It is explicitly **not** `createdAt`: intake time is not qualification time. `updatedAt`
  is the best available proxy for "last reached this state", clamped so a qualification can
  never post-date the reference "now". `createdAt <= qualifiedAt <= REFERENCE_NOW` holds.
- **Runtime fallback:** a lead qualified by a live demo mutation carries no `qualifiedAt`
  (a status override sets only status). `qualifiedInstant()` then falls back to `updatedAt`
  clamped to the reference instant — never `createdAt`.

**Existing behaviour unchanged.** No status semantics, no accepted-lead behaviour, and no
existing generated field changed. `qualifiedAt` is additive and optional.

---

## D-Q03 — Chart uses the shared demo reference clock, never the wall clock

**Where:** `apps/web/lib/dashboard/lead-flow.ts`.

All bucketing is anchored at `REFERENCE_NOW = 2026-04-22T17:00:00.000Z` (the shared demo
"now"), never `Date.now()`. UTC throughout — every lead timestamp is a `Z` instant and
only UTC calendar parts are read, so no local-time day-shift can occur. Range math is
covered by `lead-flow.test.ts` (UTC-boundary and future-lead-exclusion cases).
