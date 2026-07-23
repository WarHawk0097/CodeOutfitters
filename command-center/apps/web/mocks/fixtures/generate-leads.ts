// Deterministic synthetic mock data for development and testing. Not canonical customer data.
//
// The canonical C-D05 frame states "128 total" in its header but literally defines only the
// 10 rows of page 1 (the `L` array in Dashboard/Command Center Final.dc.html:1363). The other
// 118 records never existed — no source, canonical or otherwise, defines them. Rather than
// hand-author 118 records and present them as extracted values, this module GENERATES them
// from a fixed seed. Nothing here is canonical: the names, companies, owners, services, dates
// and statuses below are invented inputs to a deterministic function.
//
// The 10 seed rows are imported from ./leads and kept at indices 0-9 so page 1 of the
// default (unsorted) view still renders the canonical frame. They are deterministic seed
// rows based on the visible canonical examples: only the fields directly extracted from
// the `L` array are classified as canonical, and every other field on them is synthetic
// test data.
//
// Most synthetic records are dated older than the oldest seed row. Six are deliberately
// NOT: the C-D05 header states "12 new this week" and only six seed rows fall inside the
// reference week, so six synthetic records are placed inside that window to make the
// aggregate a real count over the dataset rather than a hard-coded string. They are dated
// older than all six in-window seed rows, so a descending createdAt sort still leads with
// the six the canonical frame shows. See REFERENCE_NOW below for the full definition.
import { isQualifiedStatus, LeadStatusSchema, type Lead, type LeadStatus } from "@command-center/contracts";
import { LEAD_FIXTURES } from "./leads";

export const TOTAL_LEAD_COUNT = 128;

// Synthetic name/company/service pools. Invented for mock data, not extracted from anything.
const FIRST_NAMES = [
  "Amara", "Bennett", "Camila", "Devon", "Elise", "Farid", "Greta", "Hugo",
  "Imani", "Jonas", "Kiera", "Lucas", "Maren", "Nikhil", "Odette", "Pablo",
  "Quinn", "Rosa", "Silas", "Tessa", "Ulric", "Vera", "Wyatt", "Xiomara",
  "Yusuf", "Zara",
];
const LAST_NAMES = [
  "Alvarez", "Brennan", "Castellano", "Dupree", "Eriksen", "Fontaine", "Garrity",
  "Holloway", "Ishikawa", "Jarrell", "Kowalski", "Lindqvist", "Moreau", "Nakamura",
  "Okonkwo", "Pemberton", "Quintero", "Rasmussen", "Sandoval", "Thibault",
  "Ustinov", "Vance", "Whitaker", "Yarrow",
];
const COMPANY_HEADS = [
  "Alpine", "Bedrock", "Cobalt", "Driftwood", "Everline", "Fairmount", "Granite",
  "Hollowbrook", "Ivory", "Junction", "Kestrel", "Lakeshore", "Mosaic", "Northgate",
  "Oakfield", "Pinnacle", "Quarry", "Redstone", "Summit", "Thornton",
];
const COMPANY_TAILS = [
  "Dental", "Logistics", "Realty", "Fitness", "Energy", "Accounting", "Hospitality",
  "Security", "Health", "Outfitters", "Partners", "Industries", "Collective", "Works",
];

// Service names reuse the values already present in the seed rows, so the service
// facet has a consistent vocabulary. The COUNTS are not canonical — see computeServiceFacets.
const SERVICES = [
  "AI Automation", "Workflow Automation", "Web Applications", "AI Agents",
  "Custom Software", "Integrations", "Business Systems",
];
const SERVICE_PAGES: Record<string, string> = {
  "AI Automation": "/services/ai-automation",
  "Workflow Automation": "/services/workflow",
  "Web Applications": "/services/web-apps",
  "AI Agents": "/services/ai-agents",
  "Custom Software": "/services/custom-software",
  Integrations: "/services/integrations",
  "Business Systems": "/work",
};
const OWNERS = [
  { owner: "user-001", ownerName: "Priya Nair" },
  { owner: "user-002", ownerName: "Marc Rivera" },
  { owner: "unassigned", ownerName: "Unassigned" },
];
const APPOINTMENT_STATUSES = [
  "not_started", "abandoned", "scheduled", "completed", "cancelled", "rescheduled", "no_show",
] as const;

// mulberry32 — small deterministic PRNG. No Math.random, no clock: same seed, same output.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_LEAD_SEED = 20260722;

const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Fixed reference instant for the two header aggregates. NEVER the real clock.
//
// REFERENCE_NOW is pinned by the seed rows themselves: lead-001 renders the
// canonical "2h" age label and is dated 2026-04-22T15:00Z, so "now" for this
// dataset is 2026-04-22T17:00Z. Every age label on the ten seed rows (2h, 6h,
// 1d, 2d, 4d, 5d, 8d, 11d, 18d, 29d) agrees with that instant.
//
//   as-of              2026-04-22T17:00:00.000Z
//   week window        [2026-04-15T17:00:00.000Z, 2026-04-22T17:00:00.000Z]
//                      half-open at the start, inclusive at the end
//   timezone           UTC throughout — every timestamp in this dataset is a Z
//                      instant and no local-time conversion is ever applied
//   "new this week"    createdAt inside the window above
//   "awaiting first
//    contact"          status === "New", i.e. never contacted. It is the only
//                      status that means no outbound contact has happened; every
//                      other status implies at least one touch.
//
// Both figures are counted over the whole dataset by countNewThisWeek() and
// countAwaitingFirstContact() below, and asserted in generate-leads.test.ts.
// ---------------------------------------------------------------------------
export const REFERENCE_NOW = "2026-04-22T17:00:00.000Z";
const REFERENCE_NOW_MS = Date.parse(REFERENCE_NOW);
export const REFERENCE_WEEK_START = "2026-04-15T17:00:00.000Z";
const REFERENCE_WEEK_START_MS = Date.parse(REFERENCE_WEEK_START);

/** CANON 143 "12 new this week". */
export const NEW_THIS_WEEK_COUNT = 12;
/** CANON 143 "9 awaiting first contact". */
export const AWAITING_FIRST_CONTACT_COUNT = 9;

export function isNewThisWeek(lead: Pick<Lead, "createdAt">): boolean {
  const ms = Date.parse(lead.createdAt);
  return ms > REFERENCE_WEEK_START_MS && ms <= REFERENCE_NOW_MS;
}

export function countNewThisWeek(rows: readonly Lead[]): number {
  return rows.filter(isNewThisWeek).length;
}

/** "New" is the only status meaning no outbound contact has been made yet. */
export function isAwaitingFirstContact(lead: Pick<Lead, "status">): boolean {
  return lead.status === "New";
}

export function countAwaitingFirstContact(rows: readonly Lead[]): number {
  return rows.filter(isAwaitingFirstContact).length;
}

// The seed rows are fixed and are NOT altered to hit the two targets — only the
// synthetic remainder is shaped. Six of the ten seeds already fall inside the
// window (lead-001..lead-006; lead-007 is 8d old and outside it) and exactly one
// seed carries status "New", so the generator has to supply the balance.
const SEED_IN_WEEK = countNewThisWeek(LEAD_FIXTURES);
const SEED_AWAITING = countAwaitingFirstContact(LEAD_FIXTURES);
const GENERATED_IN_WEEK = NEW_THIS_WEEK_COUNT - SEED_IN_WEEK;
const GENERATED_AWAITING = AWAITING_FIRST_CONTACT_COUNT - SEED_AWAITING;

// The in-week synthetic records are placed in the 48h gap between the window
// start (2026-04-15T17:00Z) and the oldest in-window seed row lead-006
// (2026-04-17T17:00Z), at 6h steps from +2h. They therefore land inside the week
// while staying older than all six in-window seed rows, so a descending createdAt
// sort still leads with the canonical six.
const IN_WEEK_FIRST_OFFSET_MS = 2 * 3_600_000;
const IN_WEEK_STEP_MS = 6 * 3_600_000;

// Every remaining synthetic record is dated a day apart stepping backwards from
// 2026-03-23T17:00Z, one day before the oldest seed row.
const GENERATED_START_MS = Date.parse("2026-03-23T17:00:00.000Z");

/**
 * Refuse to produce synthetic records unless mock mode is explicitly requested.
 *
 * The msw worker is already gated on NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE=mock, but that
 * variable could be set in a real deployment by mistake. This makes the failure loud and
 * immediate instead of silently serving 128 invented leads as if they were customer records.
 * Tests set the mode via vitest config; NODE_ENV=test also satisfies the guard.
 */
export function assertMockDataAllowed(): void {
  const mode = process.env.NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE;
  if (mode === "mock" || process.env.NODE_ENV === "test") return;
  throw new Error(
    "Refusing to generate synthetic lead data: NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE is " +
      `"${mode ?? "unset"}", not "mock". This data is synthetic test data and must never be ` +
      "served as real records.",
  );
}

// ---------------------------------------------------------------------------
// Canonical people who appear on a screen OTHER than Leads.
//
// The canonical Pipeline cards (CANON 1377-1387) and the Proposals directory
// (CANON 1429) name four people the ten canonical Leads rows do not contain. They
// have to BE leads: an opportunity, a proposal and a follow-up each reference a
// lead by id, and a card for somebody who is not in the lead dataset would be a
// relationship that does not exist.
//
// Rather than grow the dataset past its canonical 128 — which would change the
// Leads header total — each name CLAIMS an existing synthetic record: the first
// unclaimed generated row whose serviceInterest already matches the service the
// canonical card shows. Only `name` and `company` are replaced. Every field that
// any aggregate is computed from (status, owner, service, dates) is untouched, so
// the Leads total, the owner facet counts, the service facet counts, "new this
// week" and "awaiting first contact" are all unchanged. The replaced values were
// invented by the pools above and were never canonical.
const CANONICAL_EXTERNAL_LEADS = [
  { name: "Nadia Karim", company: "Ferrostar Freight", service: "Integrations" },
  { name: "Owen Bradley", company: "Cedar Point Legal", service: "Workflow Automation" },
  { name: "Yusuf Adeyemi", company: "Crestline Dental", service: "AI Automation" },
  { name: "Marcus Cole", company: "Titan Manufacturing", service: "Custom Software" },
] as const;

export const CANONICAL_EXTERNAL_LEAD_NAMES: readonly string[] = CANONICAL_EXTERNAL_LEADS.map(
  (entry) => entry.name,
);

function applyCanonicalExternalLeads(rows: Lead[], firstGeneratedIndex: number): void {
  const claimed = new Set<number>();
  for (const entry of CANONICAL_EXTERNAL_LEADS) {
    for (let i = firstGeneratedIndex; i < rows.length; i += 1) {
      if (claimed.has(i)) continue;
      const row = rows[i]!;
      if (row.serviceInterest !== entry.service) continue;
      claimed.add(i);
      rows[i] = { ...row, name: entry.name, company: entry.company };
      break;
    }
  }
}

/**
 * Generate the full mock lead dataset: the seed rows followed by deterministically
 * generated synthetic records, `TOTAL_LEAD_COUNT` in total.
 *
 * Deterministic synthetic mock data for development and testing. Not canonical customer data.
 */
export function generateLeads(seed: number = MOCK_LEAD_SEED): Lead[] {
  assertMockDataAllowed();
  const random = mulberry32(seed);
  const pick = <T>(pool: readonly T[]): T => pool[Math.floor(random() * pool.length)]!;

  // "New" is drawn deliberately, not randomly: the total has to land on exactly
  // AWAITING_FIRST_CONTACT_COUNT, so it is excluded from the random pool and
  // assigned to a fixed prefix of the synthetic block below.
  const statuses: readonly LeadStatus[] = LeadStatusSchema.options.filter((s) => s !== "New");
  const rows: Lead[] = [...LEAD_FIXTURES];
  // Captured before the loop: `rows` grows as records are pushed, so reading rows.length
  // inside the loop would pin the date offset to 0 and give every record the same createdAt.
  const seedCount = rows.length;

  for (let i = seedCount; i < TOTAL_LEAD_COUNT; i += 1) {
    // 0-based index within the synthetic block.
    const g = i - seedCount;
    const createdMs =
      g < GENERATED_IN_WEEK
        ? REFERENCE_WEEK_START_MS + IN_WEEK_FIRST_OFFSET_MS + g * IN_WEEK_STEP_MS
        : GENERATED_START_MS - (g - GENERATED_IN_WEEK) * DAY_MS;
    // updatedAt is always >= createdAt: a lead cannot be updated before it exists.
    const updatedMs = createdMs + Math.floor(random() * 5) * DAY_MS;
    const service = pick(SERVICES);
    const assignee = pick(OWNERS);
    rows.push({
      // Stable zero-padded ids: lead-011 .. lead-128.
      id: `lead-${String(i + 1).padStart(3, "0")}`,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      company: `${pick(COMPANY_HEADS)} ${pick(COMPANY_TAILS)}`,
      status: g < GENERATED_AWAITING ? "New" : pick(statuses),
      owner: assignee.owner,
      ownerName: assignee.ownerName,
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(updatedMs).toISOString(),
      serviceInterest: service,
      sourcePage: SERVICE_PAGES[service] ?? "/",
      appointmentStatus: pick(APPOINTMENT_STATUSES),
    });
  }

  applyCanonicalExternalLeads(rows, seedCount);

  return rows.map(withQualifiedAt);
}

// Deterministic qualification timestamp for the Dashboard Lead-flow chart's
// qualifiedLeads series. Set on exactly the leads whose status is at or beyond
// QUALIFIED_STATUS_FLOOR (isQualifiedStatus), and on no others — so the count of rows
// carrying qualifiedAt equals the status-derived qualified count by construction.
//
// The instant reuses the already-computed updatedAt (the lead's last state change),
// clamped to REFERENCE_NOW so a qualification can never post-date "now". updatedAt is
// always >= createdAt, so createdAt <= qualifiedAt <= REFERENCE_NOW holds. This draws
// NO new random values, so every other generated field stays byte-for-byte identical.
// It is explicitly NOT createdAt: intake time is not qualification time.
function withQualifiedAt(lead: Lead): Lead {
  if (!isQualifiedStatus(lead.status)) return lead;
  const qualifiedMs = Math.min(REFERENCE_NOW_MS, Date.parse(lead.updatedAt));
  return { ...lead, qualifiedAt: new Date(qualifiedMs).toISOString() };
}
