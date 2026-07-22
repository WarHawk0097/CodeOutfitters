// leads.list, leads.patch — api-contracts.json
// GET /leads (rows,total,facetCounts), PATCH /leads/:id
// leads.patch: 422 reason_required for Won/Lost/FUL, 409 conflict -> rollback, humanApproval "reason dialog"
import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, PaginationParamsSchema, listEnvelopeSchema } from "./shared";

// Canonical C-D05 renders 11 lead statuses. api-contracts.json names Won/Lost/FUL only
// for the 422 reason rule and entities.json lists `status` with no enumerated values, so no
// integration-layer authority defines a closed set. Per CANONICAL-AUTHORITY.md the .dc.html
// frame is therefore the sole source for the display set — the ST map at
// "Command Center Final.dc.html":1362. This enum is exactly that set, in canonical order.
//
// "Qualified" was removed 2026-07-22 as an unsupported additive value. It was introduced as a
// Phase 1/2 authoring choice with no authority behind it; a targeted search of
// PHASE0-DECISION-CLOSURE.md, PHASED-IMPLEMENTATION-PLAN.md, the whole Dashboard/ authority
// tree (docs, integration-layer, source, contracts, schemas, state matrices, .dc.html) found
// zero supporting occurrences. See PHASE-3-PROVENANCE-AUDIT.md CLAIM-QUAL-001.
export const LeadStatusSchema = z.enum([
  "New",
  "Contacted",
  "Appt Pending",
  "Appt Scheduled",
  "Discovery Done",
  "Proposal Req.",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "FUL", // Follow-Up-Later
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// Canonical C-D05 display order (ST map, Command Center Final.dc.html:1362).
// Derived from the enum rather than restated: the enum is already in canonical order, so a
// second hand-maintained list could only drift out of sync with it.
export const CANONICAL_LEAD_STATUS_ORDER: readonly LeadStatus[] = LeadStatusSchema.options;

// Statuses that require a human-entered reason per api-contracts.json validation rule.
export const REASON_REQUIRED_STATUSES: readonly LeadStatus[] = ["Won", "Lost", "FUL"];

// Dashboard/integration-layer/appointment-states.json — canonical statuses.
export const AppointmentStatusSchema = z.enum([
  "not_started",
  "abandoned",
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
  "no_show",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const LeadSchema = z.object({
  id: IdSchema,
  name: z.string(),
  company: z.string(),
  status: LeadStatusSchema,
  owner: IdSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  // Phase 3 additions — Dashboard/integration-layer/entities.json Lead fields,
  // required by C-D05 Leads table columns (SERVICE / APPOINTMENT / NEXT STEP).
  // Optional: preserves backward compatibility with Phase 1/2 consumers.
  serviceInterest: z.string().optional(),
  appointmentStatus: AppointmentStatusSchema.optional(),
  nextFollowUpAt: IsoDateTimeSchema.optional(),
  // Source page that produced the lead (entities.json `sourcePage`), rendered
  // under the lead name in the canonical C-D05 LEAD cell.
  sourcePage: z.string().optional(),
  // Resolved owner display name. `owner` stays an opaque IdSchema for the API
  // boundary; this is what the UI renders so no raw "user-001" reaches a screen.
  ownerName: z.string().optional(),
  // Authored relative-time display strings ("2h", "1d ago", "Today", "Overdue",
  // "Apr 24"). Canonical C-D05 renders these, and they cannot be derived from the
  // ISO fields without reading the clock — which would break deterministic mock
  // mode and the visual comparison harness. The ISO fields above remain the typed
  // source of truth; these are presentation-only and optional.
  createdAgoLabel: z.string().optional(),
  lastContactedLabel: z.string().optional(),
  nextStepLabel: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

// Canonical C-D05 pages ten rows: the footer reads "1–10 OF 128" and offers pages
// 1 2 3 … 13 ("Command Center Final.dc.html":194). PaginationParamsSchema's platform
// default of 25 is left untouched for other list endpoints; Leads states its own size
// here so the two cannot drift silently.
export const LEADS_PAGE_SIZE = 10;

// Leads list query. Extends the shared pagination params rather than restating them,
// so there is exactly one pagination DTO in the codebase.
export const LeadsListParamsSchema = PaginationParamsSchema.extend({
  pageSize: z.number().int().positive().max(200).default(LEADS_PAGE_SIZE),
  status: LeadStatusSchema.optional(),
  service: z.string().optional(),
  // Owner is filtered by the opaque id, not the display name.
  owner: IdSchema.optional(),
  q: z.string().optional(),
});
export type LeadsListParams = z.infer<typeof LeadsListParamsSchema>;

// The owner dimension is a DIRECTORY, not a summary of the rows that came back.
// It exists because a client cannot resolve an owner's display name from a page it
// does not hold: filter to one owner, then search for something that owner has none
// of, and the page is empty while the filter is still applied. Deriving the label
// from the rows in that state produces a wrong label, not a missing one.
//
// Contract guarantees:
//   1. Every selectable owner appears, on every response, regardless of the current
//      page, the current search term, the selected owner, or a zero-row result.
//   2. `id` is the opaque owner value accepted by LeadsListParamsSchema.owner.
//      "unassigned" is a REAL owner value with the display label "Unassigned" — it is
//      not a null sentinel, and nothing may fall back to it.
//   3. `label` is the human-facing display name. It is authoritative: clients must
//      resolve owner labels from here and never from row data.
//   4. `count` semantics: the number of rows matching every OTHER active filter
//      (status, service, search) with the owner dimension EXCLUDED. It answers "how
//      many rows would I get if I picked this owner", which is what a facet is for.
//      It is deliberately NOT the count within the fully matched set — that would be
//      `total` for the selected owner and zero for every other one, which is useless
//      for choosing.
export const OwnerFacetSchema = z.object({
  id: IdSchema,
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
});
export type OwnerFacet = z.infer<typeof OwnerFacetSchema>;

// The label a client shows for a selected owner id that is not in the directory.
// Never "Unassigned": that is a different real owner. Neutral, so a stale or hand-typed
// id degrades into an honest "we do not know who this is" rather than a confident lie.
export const UNKNOWN_OWNER_LABEL = "Unknown owner";

// The list envelope carries the echoed page and pageSize so a client never has to
// remember what it asked for to interpret what it got. `pageCount` is deliberately
// NOT transported: it is derived from total and pageSize at the point of display, so
// it cannot disagree with them.
export const LeadsListResponseSchema = listEnvelopeSchema(LeadSchema).extend({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  // Service facets are a second, independent facet dimension the canonical C-D05
  // "SERVICE · FACETED COUNTS" popover renders. The handler already derives it.
  serviceFacetCounts: z.record(z.string(), z.number().int().nonnegative()),
  // Stable owner directory. See OwnerFacetSchema for the guarantees it carries.
  ownerFacets: z.array(OwnerFacetSchema),
  // C-D05 143 header: "128 total · 12 new this week · 9 awaiting first contact".
  // Both clauses are aggregates over the WHOLE matched set, so they belong on the
  // envelope next to `total` — the client only ever holds one page and cannot
  // compute them. Deliberately NOT fields on LeadSchema: they describe the result
  // set, not any individual lead.
  newThisWeekCount: z.number().int().nonnegative(),
  awaitingFirstContactCount: z.number().int().nonnegative(),
});
export type LeadsListResponse = z.infer<typeof LeadsListResponseSchema>;

// Total and page size are the only inputs; a stored page count could drift from them.
export function pageCountOf(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

// Canonical human-facing labels for values the API carries in machine form.
// Rule: a mapping exists only where canonical copy supports it, or where the
// transform is the standard snake_case-to-Title-Case reading of the same word.
//
// "FUL" -> "Follow Up Later": the canonical ST status map keys this status
// 'Follow Up Later' ("Command Center Final.dc.html":1362). The contract enum uses the
// short form the C-D05 table cell renders.
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  New: "New",
  Contacted: "Contacted",
  "Appt Pending": "Appt Pending",
  "Appt Scheduled": "Appt Scheduled",
  "Discovery Done": "Discovery Done",
  "Proposal Req.": "Proposal Req.",
  "Proposal Sent": "Proposal Sent",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
  FUL: "Follow Up Later",
};

// appointment-states.json values are snake_case identifiers; these are the same words
// read back in Title Case. No meaning is added.
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  not_started: "Not Started",
  abandoned: "Abandoned",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  no_show: "No Show",
};

export const LeadsPatchRequestSchema = z.object({
  status: LeadStatusSchema.optional(),
  owner: IdSchema.optional(),
  reason: z.string().min(1).optional(),
}).superRefine((val, ctx) => {
  if (val.status && REASON_REQUIRED_STATUSES.includes(val.status) && !val.reason) {
    ctx.addIssue({ code: "custom", message: "reason_required", path: ["reason"] });
  }
});
export type LeadsPatchRequest = z.infer<typeof LeadsPatchRequestSchema>;

export const LeadsPatchResponseSchema = LeadSchema;
