// Deterministic Pipeline Journey fixture. Values copied verbatim from the design
// authority (Dashboard/Command Center Final.dc.html lines 1351-1359, palette line 1311)
// — no invented stages, counts, or relationships. No contract/endpoint backs this data
// yet; see packages/ui/src/pipeline-journey.tsx for the documented gap.
import type { PipelinePhase } from "@command-center/ui";

// Design source palette (G) — Dashboard/Command Center Final.dc.html line 1311.
const G = {
  gr: "#2F7D4F",
  grI: "#276B42",
  grT: "#E2F0E7",
  am: "#B07C24",
  amI: "#8A5F17",
  amT: "#F4EBD4",
  rd: "#A63D2B",
  bl: "#46708E",
  nt: "#85826F",
};

export const PIPELINE_JOURNEY_ACTIVE_COUNT = "86";

export const PIPELINE_PHASE_FIXTURES: PipelinePhase[] = [
  {
    name: "Intake",
    color: G.bl,
    count: "25",
    conversionText: "entry phase",
    ageText: "1.1 days",
    alertText: null,
    segments: [
      { color: G.bl, widthPercent: "56%" },
      { color: G.nt, widthPercent: "44%" },
    ],
  },
  {
    name: "Appointment",
    color: G.am,
    count: "16",
    conversionText: "74% from Intake",
    ageText: "2.0 days",
    alertText: "3 waiting > 48h",
    alertColor: G.amI,
    alertTint: G.amT,
    segments: [
      { color: G.am, widthPercent: "44%" },
      { color: G.gr, widthPercent: "56%" },
    ],
  },
  {
    name: "Discovery",
    color: G.bl,
    count: "8",
    conversionText: "62% from Appointment",
    ageText: "3.4 days",
    alertText: null,
    segments: [{ color: G.bl, widthPercent: "100%" }],
  },
  {
    name: "Proposal",
    color: G.am,
    count: "13",
    conversionText: "81% from Discovery",
    ageText: "4.2 days",
    alertText: "2 unviewed 5+ days",
    alertColor: G.amI,
    alertTint: G.amT,
    segments: [
      { color: G.am, widthPercent: "46%" },
      { color: G.bl, widthPercent: "54%" },
    ],
  },
  {
    name: "Decision",
    color: G.am,
    count: "5",
    conversionText: "38% from Proposal",
    ageText: "6.5 days",
    alertText: null,
    segments: [{ color: "#96731F", widthPercent: "100%" }],
  },
  {
    name: "Outcome",
    color: G.gr,
    count: "19",
    conversionText: "63% win rate",
    ageText: "—",
    alertText: null,
    segments: [
      { color: G.gr, widthPercent: "63%" },
      { color: G.rd, widthPercent: "21%" },
      { color: G.nt, widthPercent: "16%" },
    ],
  },
];
