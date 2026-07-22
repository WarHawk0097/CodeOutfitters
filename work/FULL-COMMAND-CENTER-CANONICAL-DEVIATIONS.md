# Canonical deviations — full Command Center UI

Running log, written as each deviation is made. Folded into
`FULL-COMMAND-CENTER-UI-IMPLEMENTATION-REPORT.md` at the end.

Design authority: `F:\CodeOutfitters\Dashboard\Command Center Final.dc.html`
SHA-256 `758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522`

Each entry states: the canonical source, what the canonical source says, what was built,
and why the two differ.

---

## D-01 · Pipeline stage window is contiguous

- **Canonical source:** C-D06 line 213 (desktop Pipeline).
- **Canonical says:** the header chip reads `STAGES 2–5 OF 11`, and the four drawn columns
  are Contacted, Appointment Pending, Appointment Scheduled, **Proposal Sent**. In the
  canonical stage order Proposal Sent is stage 7, not stage 5.
- **Built:** a contiguous window. `STAGES 2–5 OF 11` shows Contacted, Appointment Pending,
  Appointment Scheduled, Discovery Done. The label is computed from the window, so the two
  can never disagree.
- **Why:** the label and the drawing cannot both be satisfied, and the `‹ ›` pager is a live
  control in the implementation rather than a static illustration. A chip reading "2–5" over
  a non-contiguous set makes every subsequent page of the pager nonsense, and the brief
  requires that displayed counts and positions never contradict the underlying data.
- **Visible effect:** the fourth desktop column shows Discovery Done where the canonical
  frame draws Proposal Sent. Proposal Sent remains reachable by paging the chip.
- **Code:** `apps/web/app/(shell)/pipeline/stage-window.ts`,
  asserted in `apps/web/app/(shell)/pipeline/pipeline.test.tsx`.

## D-02 · Pipeline toolbar is additive

- **Canonical source:** C-D06, T-03, MO-03 — no Pipeline frame draws a search field or a
  filter row.
- **Canonical says:** nothing; the control does not exist in the design.
- **Built:** a toolbar above the board with search, owner, service and priority filters, a
  Clear filters button and New opportunity.
- **Why:** the implementation brief requires Pipeline to have "search, filters, owner filter,
  service filter, value/priority" and "create opportunity". The design does not draw them, so
  they are added in the shared `RouteToolbar` treatment rather than invented per route.
- **Visible effect:** one extra row of chrome above the canonical board.

## D-03 · Synthetic stage tones for the seven undrawn stages

- **Canonical source:** CANON 1379–1388 (`pipeCols`).
- **Canonical says:** colours for four stages only — Contacted `G.nt`, Appointment Pending
  `G.am`, Appointment Scheduled `G.gr`, Proposal Sent `G.bl`.
- **Built:** the four canonical tones are used verbatim. New, Discovery Done, Proposal Req.,
  Negotiation, Won, Lost and FUL carry synthetic tones from the same canonical palette,
  following the design's own grammar (waiting = amber, in motion = blue, closed-won = green,
  closed-lost = red).
- **Why:** no canonical frame draws those seven stages, but the pager reaches them.
- **Code:** `STAGE_TONE` in `apps/web/app/(shell)/pipeline/pipeline-board.tsx`.

## D-04 · Appointments seed adds one synthetic row to satisfy the canonical counts

- **Canonical source:** C-D11 line 316 (subtitle "7 upcoming · 3 today").
- **Canonical says:** the header must read 7 upcoming and 3 today; the frame draws only a few
  representative rows, not the whole set.
- **Built:** an eight-row appointment seed. Seven are the rows the canonical frames name; one
  synthetic row (Sofia Marchetti, 2026-04-22 16:00) exists so the derived counts equal the
  canonical subtitle. The subtitle is computed from the seed, never hard-coded.
- **Why:** the brief requires the count and the underlying data to agree, and the subtitle is
  derived. A literal "7 upcoming" over six rows would contradict the list.
- **Code:** appointment seed in `apps/web/lib/demo/seed.ts`; subtitle in
  `apps/web/app/(shell)/appointments/appointments-header.tsx`.

## D-05 · Appointment states beyond the three canonical tones

- **Canonical source:** C-D11 318/328/336 draws READY (green), PREPARATION NEEDED (amber),
  NO-SHOW (red).
- **Built:** `completed` (blue), `cancelled` (neutral) and `rescheduled` (amber) reuse the
  same canonical palette by the design's own grammar. They are needed because an appointment
  can reach those states through the Past view and the cancel/reschedule mutations.
- **Why:** the design draws only the three states its example rows are in; the route's
  required mutations produce three more.
- **Code:** `STATE_META` in `apps/web/app/(shell)/appointments/appointments-view.tsx`.

## D-06 · Meetings gains a CANCELLED state and a live Needs-review count

- **Canonical source:** CANON 1392–1396 (`meetings`), M-D01 445, MO-08 1157.
- **Canonical says:** four meeting states — READY, NEEDS REVIEW, COMPLETED, FAILED · NO-SHOW —
  and a switch whose third item reads "Needs review · 2".
- **Built:** the type adds `LIVE` (the state the canonical "Live" tab filters to, drawn on the
  live-workspace frames) and `CANCELLED` (a called-off meeting; the canonical set has no value
  for it and reusing FAILED · NO-SHOW would misreport why the meeting did not happen). The
  "Needs review" tab count is derived from the data (1 at seed), not the static "· 2" the
  frame prints.
- **Why:** the route's cancel mutation and its four-view switch both need states the four-value
  canonical set does not carry, and the brief forbids a displayed count that contradicts the
  data.
- **Code:** `MeetingState` in `apps/web/lib/demo/types.ts`; `STATE_TONE`, `VIEW_STATES`,
  `viewLabel` in `apps/web/app/(shell)/meetings/meetings-view.tsx`.

## D-07 · Meetings toolbar and date filter are additive

- **Canonical source:** M-D01 — no meeting frame draws a search field, an owner filter or a
  date control.
- **Built:** a shared `RouteToolbar` with search, an owner filter, a date filter (derived from
  the distinct dates of linked appointments) and a Today button.
- **Why:** the brief requires Meetings to have "date controls, filters, … owner"; the design
  draws none. `Meeting.when` is an authored display string, so the date filter reads the linked
  appointment's real date rather than parsing the label.
- **Code:** `dateOptions` in `apps/web/app/(shell)/meetings/meetings-view.tsx`.
