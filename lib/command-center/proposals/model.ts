// Presentation models for the proposal command-center screens (builder P-D03..P-D09, preview
// P-D12/P-D15..P-D17 + PDF-01..15). These are view models, deliberately separate from any future
// persistence/RLS row shape — the live path keeps its own server types. Nothing here is `any`.

export type PricingLine = { id: string; name: string; detail: string; cents: number };
export type Milestone = { id: string; name: string; timing: string; paymentPct: number };

export type ValidationStatus = "valid" | "review" | "blocked";
export type ValidationItem = { id: string; label: string; status: ValidationStatus };

// ─── Builder (editable) model ─────────────────────────────────────────────────────────────────────
export type BuilderSection = {
  id: string;
  name: string;
  required: boolean;
  kind: "content" | "pricing" | "milestones";
  body: string;
};

export type ProposalBuilderDetail = {
  title: string;
  version: string;
  sections: BuilderSection[];
  pricing: PricingLine[];
  netTerms: string;
  milestones: Milestone[];
  validation: ValidationItem[];
  blockedReason: string | null;
};

// ─── Preview (read-only assembled document) model ─────────────────────────────────────────────────
// The assembled proposal renders as an ordered set of pages (PDF-01..15, grouped into the eight
// canonical spreads). Each page is real, selectable DOM — never canvas-rendered text.
export type DocBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; eyebrow: string; title: string }
  | { kind: "stat"; value: string; label: string; accent?: boolean }
  | { kind: "card"; title: string; body: string; accent?: boolean }
  | { kind: "flow"; steps: { label: string; hint: string; gate?: boolean }[] }
  | { kind: "compare"; today: string; withUs: string }
  | { kind: "pricingTable"; lines: PricingLine[]; totalLabel: string; totalCents: number }
  | { kind: "milestoneTable"; milestones: Milestone[] }
  | { kind: "keyValue"; rows: { label: string; value: string }[] }
  | { kind: "note"; text: string };

export type DocPageKind = "cover" | "section";

export type ProposalDocPage = {
  id: string;
  kind: DocPageKind;
  // Section eyebrow shown in the page navigator, e.g. "01 · Executive summary" or "Cover".
  navLabel: string;
  // Canonical page-range footer, e.g. "PAGE 2 OF 15".
  pageFooter: string;
  blocks: DocBlock[];
};

// The assembled PDF's generation status. Content is always previewable; the PDF binary itself is a
// backend artefact, so generation/download are gated in demo.
export type PdfStatus = "ready" | "outdated" | "generating" | "failed";

export type ProposalPreviewDocument = {
  proposalId: string;
  version: string;
  recipient: string; // "Priyanka Rao"
  client: string; // "Solterra Energy"
  title: string; // "Field-Service Order Automation for Solterra Energy"
  totalPageCount: number; // canonical 15
  pdfStatus: PdfStatus;
  pdfStatusDetail: string;
  netTerms: string;
  validity: string; // "valid to May 13"
  pages: ProposalDocPage[];
  validation: ValidationItem[];
  blockedReason: string | null;
};
