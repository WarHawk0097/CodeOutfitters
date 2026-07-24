// Canonical, deterministic proposal fixtures. The showcase record is PRO-2034 (Solterra Energy,
// $86,400) — its pricing, milestones, validation, and assembled document pages are modelled verbatim
// from the P-D07/P-D08/P-D06 frames and the PDF-01..15 assembled preview in Command Center Final.dc.html.
// Nothing here is invented: prices, timelines, claims, and legal language are only what the authority
// frames state. Any other real demo proposal renders honestly from the single money fact it carries
// (its total value) with no fabricated breakdown, milestones, or findings.
import type { Proposal } from "../../demo/types";
import { dollarsToCents } from "./money";
import { CANONICAL_BLOCKED_REASON, CANONICAL_VALIDATION } from "./validation";
import type {
  BuilderSection,
  Milestone,
  PricingLine,
  ProposalBuilderDetail,
  ProposalDocPage,
  ProposalPreviewDocument,
} from "./model";

export const CANONICAL_DEMO_PROPOSAL_ID = "PRO-2034";
export const CANONICAL_NET_TERMS = "Net 21";
export const CANONICAL_VALIDITY = "valid to May 13";

// P-D07 / PDF "08 · INVESTMENT" frame: four lines summing to the seed total ($86,400), Net 21.
export const CANONICAL_PRICING: PricingLine[] = [
  { id: "discovery", name: "Discovery & solution design", detail: "Requirements, solution canvas, delivery plan", cents: dollarsToCents(12000) },
  { id: "build", name: "Core build — Custom Software", detail: "Approval-gated order sync and workflow", cents: dollarsToCents(48000) },
  { id: "integrations", name: "Integrations — SAP ERP", detail: "Bi-directional sync with write-back gate", cents: dollarsToCents(16400) },
  { id: "handover", name: "QA, deployment & handover", detail: "Testing, cutover, and enablement", cents: dollarsToCents(10000) },
];

export const CANONICAL_PRICING_TOTAL_CENTS = CANONICAL_PRICING.reduce((sum, l) => sum + l.cents, 0);

// PDF "07 · DELIVERY PLAN AND MILESTONES": "Thirteen weeks, three phases." Phase 1 goes live in six
// weeks (exec summary). Payment schedule sums to 100%.
export const CANONICAL_MILESTONES: Milestone[] = [
  { id: "phase-1", name: "Phase 1 · Validated intake live", timing: "Weeks 1–6", paymentPct: 40 },
  { id: "phase-2", name: "Phase 2 · Full sync & rollout", timing: "Weeks 7–10", paymentPct: 35 },
  { id: "phase-3", name: "Phase 3 · Stabilization & handover", timing: "Weeks 11–13", paymentPct: 25 },
];

// Builder section spine. Order is template-defined; REQ flags follow "Required information".
function canonicalSections(proposal: Proposal): BuilderSection[] {
  return [
    { id: "cover", name: "Cover", required: false, kind: "content", body: `${proposal.client} — proposal cover.` },
    { id: "executive-summary", name: "Executive summary", required: true, kind: "content", body: "Recover 11 staff-hours a day, before storm season. A single validated intake feeds all three systems; sensitive writes are held for approval." },
    { id: "context", name: "Understanding & context", required: false, kind: "content", body: `Current state and goals for ${proposal.client}.` },
    { id: "proposed-solution", name: "Proposed solution", required: true, kind: "content", body: "One intake. Zero re-keying. Orders enter once through a validated portal, then flow to SAP, dispatch, and billing with an approval gate." },
    { id: "scope", name: "Scope & deliverables", required: true, kind: "content", body: `Scope and deliverables for the ${proposal.service} engagement.` },
    { id: "approach", name: "Approach & timeline", required: false, kind: "content", body: "Thirteen weeks, three phases — Phase 1 live in six weeks." },
    { id: "pricing", name: "Pricing", required: true, kind: "pricing", body: "" },
    { id: "milestones", name: "Milestones & payment schedule", required: true, kind: "milestones", body: "" },
    { id: "terms", name: "Terms & validity", required: true, kind: "content", body: "Payment terms Net 21. Applicable tax is set per client locale. Proposal valid to May 13." },
    { id: "case-studies", name: "Case studies", required: false, kind: "content", body: "Relevant case study available on request, included only with client permission." },
    { id: "team", name: "Team", required: false, kind: "content", body: "Delivery team and roles." },
    { id: "assumptions", name: "Assumptions", required: false, kind: "content", body: "SAP B1 staging access by week 1 · QuickBooks admin identified · dispatch rules documented in phase 1." },
    { id: "next-steps", name: "Next steps", required: false, kind: "content", body: "Accept, grant SAP & QuickBooks access, kickoff — three steps to a July-ready pilot." },
    { id: "appendix", name: "Appendix", required: false, kind: "content", body: "Supporting detail." },
  ];
}

/** Canonical builder detail. PRO-2034 is modelled verbatim; any other real proposal renders honestly. */
export function buildProposalDetail(proposal: Proposal): ProposalBuilderDetail {
  const sections = canonicalSections(proposal);
  if (proposal.id === CANONICAL_DEMO_PROPOSAL_ID) {
    return {
      title: "Executive Solution Proposal",
      version: proposal.version,
      sections,
      pricing: CANONICAL_PRICING,
      netTerms: CANONICAL_NET_TERMS,
      milestones: CANONICAL_MILESTONES,
      validation: CANONICAL_VALIDATION,
      blockedReason: CANONICAL_BLOCKED_REASON,
    };
  }
  return {
    title: `${proposal.service} proposal`,
    version: proposal.version,
    sections: sections.filter((s) => s.kind !== "milestones"),
    pricing: [
      { id: "total", name: `${proposal.service} engagement`, detail: "Total set per proposal", cents: dollarsToCents(proposal.value) },
    ],
    netTerms: CANONICAL_NET_TERMS,
    milestones: [],
    validation: [
      { id: "client", label: "Client and recipient details present", status: "valid" },
      { id: "review", label: "Proposal reviewed before sending", status: "review" },
    ],
    blockedReason: null,
  };
}

// ─── Assembled preview document (PDF-01..15) ──────────────────────────────────────────────────────
// The eight canonical spreads, each a real DOM page. Prose is verbatim from the PDF-01..15 frames.
const PRO_2034_PAGES: ProposalDocPage[] = [
  {
    id: "cover",
    kind: "cover",
    navLabel: "Cover",
    pageFooter: "PAGE 1 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "EXECUTIVE SOLUTION PROPOSAL", title: "Field-Service Order Automation for Solterra Energy" },
      { kind: "paragraph", text: "One validated intake. Zero re-keying. Human approval where it matters." },
      { kind: "keyValue", rows: [
        { label: "Prepared for", value: "Priyanka Rao · April 22, 2026" },
        { label: "Reference", value: "PRO-2034 · v1 · Confidential" },
      ] },
    ],
  },
  {
    id: "executive-summary",
    kind: "section",
    navLabel: "01 · Executive summary",
    pageFooter: "PAGE 2 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "01 · EXECUTIVE SUMMARY", title: "Recover 11 staff-hours a day, before storm season." },
      { kind: "paragraph", text: "Solterra's dispatch team re-keys roughly 220 work orders each weekday into SAP Business One, a custom dispatch board, and QuickBooks. That triple entry drives a ~4% error rate and about 11 staff-hours of rework daily — and it breaks first when volume spikes toward 400 orders in storm season." },
      { kind: "paragraph", text: "We propose a single validated intake feeding all three systems, with exceptions routed to a human queue and every sensitive write held for your approval. Phase 1 is scoped to go live in six weeks — before July." },
      { kind: "stat", value: "3→1", label: "entry points consolidated" },
      { kind: "stat", value: "13 wks", label: "full delivery · 3 phases" },
      { kind: "stat", value: "$86,400", label: "fixed-fee investment", accent: true },
    ],
  },
  {
    id: "current-state",
    kind: "section",
    navLabel: "02 · Current state & opportunity",
    pageFooter: "PAGE 3 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "02 · CURRENT STATE AND OPPORTUNITY", title: "Where the work leaks today." },
      { kind: "card", title: "Triple manual entry", body: "Every order is typed into SAP, the dispatch board, and QuickBooks separately. Confirmed in discovery (00:14)." },
      { kind: "card", title: "~4% order error rate", body: "Mis-keys surface downstream as billing disputes and repeat truck rolls." },
      { kind: "card", title: "Storm-season spikes to 400/day", body: "Volume doubles exactly when accuracy matters most." },
      { kind: "card", title: "The opportunity", body: "Enter once, validate at the source, and let approvals — not re-keying — be the human touchpoint.", accent: true },
    ],
  },
  {
    id: "solution",
    kind: "section",
    navLabel: "03–04 · Solution & workflow",
    pageFooter: "PAGE 4–5 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "03 · RECOMMENDED SOLUTION", title: "One intake. Zero re-keying." },
      { kind: "paragraph", text: "Orders enter once through a validated portal, then flow to SAP, dispatch, and billing automatically. Sensitive writes wait for your approval; exceptions land in a reviewed queue — nothing is silently dropped." },
      { kind: "compare", today: "3 systems · 4% errors · 11 hrs/day rework", withUs: "1 entry point · validated at source · approval-gated writes" },
      { kind: "heading", eyebrow: "04 · SOLUTION WORKFLOW", title: "" },
      { kind: "flow", steps: [
        { label: "Intake portal", hint: "validated entry" },
        { label: "Rules engine", hint: "route · dedupe" },
        { label: "Approval", hint: "human gate", gate: true },
        { label: "SAP · dispatch", hint: "synced writes" },
        { label: "Billing draft", hint: "QuickBooks" },
      ] },
      { kind: "note", text: "Exceptions → human queue · retry · audit trail." },
    ],
  },
  {
    id: "modules-scope",
    kind: "section",
    navLabel: "05–06 · Modules & scope",
    pageFooter: "PAGE 6–7 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "05 · SOLUTION MODULES", title: "Five modules, one system." },
      { kind: "paragraph", text: "The five workflow components above — intake portal, rules engine, approval gate, synced writes to SAP & dispatch, and the QuickBooks billing draft — ship as one connected system." },
      { kind: "heading", eyebrow: "06 · SCOPE AND DELIVERABLES", title: "" },
      { kind: "paragraph", text: "Included: the five modules above, staging + production deployment, training for 8 users, 30-day stabilization." },
      { kind: "paragraph", text: "Excluded: historical data migration beyond 90 days, dispatch-board rebuild, custom mobile app." },
    ],
  },
  {
    id: "delivery-investment",
    kind: "section",
    navLabel: "07–08 · Delivery & investment",
    pageFooter: "PAGE 8–10 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "07 · DELIVERY PLAN AND MILESTONES", title: "Thirteen weeks, three phases." },
      { kind: "milestoneTable", milestones: CANONICAL_MILESTONES },
      { kind: "heading", eyebrow: "08 · INVESTMENT", title: "" },
      { kind: "pricingTable", lines: CANONICAL_PRICING, totalLabel: "Total fixed investment · USD · Net 21 · valid to May 13", totalCents: CANONICAL_PRICING_TOTAL_CENTS },
    ],
  },
  {
    id: "assurance",
    kind: "section",
    navLabel: "09–11 · Assurance",
    pageFooter: "PAGE 11–13 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "09 · ASSUMPTIONS, RISKS, AND EXCLUSIONS", title: "" },
      { kind: "card", title: "Assumptions", body: "SAP B1 staging access by week 1 · QuickBooks admin identified · dispatch rules documented with your team in phase 1." },
      { kind: "card", title: "Risks & dependencies", body: "Dispatch board has no API — file-drop bridge fallback scoped · storm-season freeze window honored for go-lives." },
      { kind: "heading", eyebrow: "10 · SECURITY AND RELIABILITY", title: "" },
      { kind: "paragraph", text: "Role-based access, audit trail on every write, approval gates on sensitive operations, encrypted in transit and at rest, rollback plan per phase. Reliability targets are agreed in phase 1 against measured baselines — we don't quote uptime we haven't verified." },
      { kind: "heading", eyebrow: "11 · WHY CODEOUTFITTERS", title: "" },
      { kind: "paragraph", text: "We build operational systems with human approval points by default — the same pattern running in our own Command Center. Relevant case study available on request, included only with client permission." },
    ],
  },
  {
    id: "next-acceptance",
    kind: "section",
    navLabel: "12–13 · Next steps & acceptance",
    pageFooter: "PAGE 14–15 OF 15",
    blocks: [
      { kind: "heading", eyebrow: "12 · NEXT STEPS", title: "Three steps to a July-ready pilot." },
      { kind: "card", title: "1 · Accept", body: "Accept this proposal to hold the delivery window." },
      { kind: "card", title: "2 · Grant access", body: "Grant SAP and QuickBooks access (phase 1)." },
      { kind: "card", title: "3 · Kickoff", body: "Kickoff with your team." },
      { kind: "heading", eyebrow: "13 · ACCEPTANCE", title: "" },
      { kind: "paragraph", text: "Accepted PRO-2034 at the $86,400 fixed fee as stated. Typed-name acceptance; optional e-signature requires a connected provider." },
    ],
  },
];

/**
 * Build the read-only assembled preview document for a proposal. PRO-2034 returns the canonical
 * eight-spread document. Any other real proposal returns an honest minimal document from the facts it
 * carries — never a fabricated 15-page set.
 */
export function buildPreviewDocument(proposal: Proposal): ProposalPreviewDocument {
  if (proposal.id === CANONICAL_DEMO_PROPOSAL_ID) {
    return {
      proposalId: proposal.id,
      version: proposal.version,
      recipient: "Priyanka Rao",
      client: "Solterra Energy",
      title: "Field-Service Order Automation for Solterra Energy",
      totalPageCount: 15,
      // Canonical demo state: content was edited in the builder after the last PDF was generated
      // (P-D16 "Outdated"). The PDF binary is a backend artefact, so regeneration is disabled.
      pdfStatus: "outdated",
      pdfStatusDetail: "Content edited after the last PDF was generated. Regenerate before sending.",
      netTerms: CANONICAL_NET_TERMS,
      validity: CANONICAL_VALIDITY,
      pages: PRO_2034_PAGES,
      validation: CANONICAL_VALIDATION,
      blockedReason: CANONICAL_BLOCKED_REASON,
    };
  }
  return {
    proposalId: proposal.id,
    version: proposal.version,
    recipient: proposal.leadName,
    client: proposal.client,
    title: `${proposal.service} proposal`,
    totalPageCount: 1,
    pdfStatus: "ready",
    pdfStatusDetail: "This proposal has a single summary page in the demo workspace.",
    netTerms: CANONICAL_NET_TERMS,
    validity: CANONICAL_VALIDITY,
    pages: [
      {
        id: "summary",
        kind: "section",
        navLabel: "Summary",
        pageFooter: "PAGE 1 OF 1",
        blocks: [
          { kind: "heading", eyebrow: proposal.id, title: `${proposal.service} proposal` },
          { kind: "keyValue", rows: [
            { label: "Client", value: proposal.client },
            { label: "Total", value: "Total set per proposal" },
          ] },
          { kind: "pricingTable", lines: [{ id: "total", name: `${proposal.service} engagement`, detail: "Total set per proposal", cents: dollarsToCents(proposal.value) }], totalLabel: "Total · USD · Net 21", totalCents: dollarsToCents(proposal.value) },
        ],
      },
    ],
    validation: [
      { id: "client", label: "Client and recipient details present", status: "valid" },
      { id: "review", label: "Proposal reviewed before sending", status: "review" },
    ],
    blockedReason: null,
  };
}
