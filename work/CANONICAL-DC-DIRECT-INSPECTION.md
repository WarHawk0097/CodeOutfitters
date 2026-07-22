# CANONICAL .dc.html DIRECT INSPECTION
File: F:\CodeOutfitters\Dashboard\Command Center Final.dc.html
SHA-256 (re-verified): 758c8ae303cb89747e9835b658dc5ce05132fd3c30a072416961e6d0bcf9f522
Method: grep/sed direct read of markup (not hash-only). 1495 lines total.
This supersedes the "not directly read" caveat in INTAKE-AND-ARCHITECTURE-ANALYSIS.md section 5/9.

## Frame inventory (data-screen-label, mechanical grep count)
49 data-screen-label attributes found. Matches CHECKPOINT-MANIFEST claim structurally:
- C-D01..C-D18 desktop core: present (labels group multiple IDs per div in several cases, e.g. "C-D03 C-D04 Pipeline Journey")
- M-D01..M-D18 Meeting Intelligence: present, same grouping pattern
- P-D01..P-D17 Proposals: present
- PDF-01..15: present as single grouped label "PDF-01..15 Executive Solution Proposal"
- T-01..T-11 Tablet: present, each own div, width:820px height:1180px confirmed per-frame
- MO-01..MO-18 Mobile: present, each own div, width:390px height:844px confirmed per-frame
Full line-numbered list saved in grep output above (not re-duplicated here); all 49 labels visually inspected in the grep pass.

## Viewport widths (grep -oP "width:\d+px", direct)
Confirmed present: 390px (mobile), 820px (tablet), 1440px (desktop), plus component-level widths (196-1000px range for cards/panels/sidebar).
No 1280px desktop frame width found — desktop frames use 1440px consistently where checked (e.g. C-D06 Pipeline: 1440x1000).

## Fonts (grep -oP "font-family:...", direct)
- 'Geist' — confirmed (sidebar, e.g. C-D06 aside style="...font-family:'Geist'")
- 'Geist Mono' — confirmed present
- 'IBM Plex Mono' — confirmed present (frame annotation labels, e.g. "C-D06 · PIPELINE · ...")
- 'IBM Plex Sans' — confirmed present (1 grep hit; body text default, not repeated per-element since likely set at a higher scope/base style)
Matches docs/DESIGN-TOKENS.md canonical block claim (IBM Plex Sans/Mono body + Geist sidebar). No conflict found.

## Colors (grep -oP "#[0-9A-Fa-f]{6}", direct)
- #14130E confirmed as sidebar background (aside style, C-D06 frame directly read: background:#14130E)
- #2F7D4F confirmed present (primary green, e.g. "Move to stage" pill color #276B42 / #2F7D4F family, Live Pitch "Present mode" label color:#2F7D4F)
- #EDF0F2 confirmed as canvas/body background, 40 occurrences across desktop/tablet/mobile frames
Matches canonical token block in section 5 of INTAKE-AND-ARCHITECTURE-ANALYSIS.md. No conflict.

## Rejected legacy patterns — absence proof (grep, case-insensitive, literal string match only)
- "grouped-bar" — 0 occurrences
- "extraction" — 0 occurrences
- "viewport control" — 0 occurrences
- Eleven horizontal Pipeline Distribution bars — not found; C-D06 Pipeline frame directly read shows 4-column CSS grid (`grid-template-columns:repeat(4,1fr)`) with `sc-for` over `pipeCols`, header text "STAGES 2–5 OF 11 ‹ ›" meaning 11 stages exist but are paginated 4-at-a-time in a grid, not rendered as 11 horizontal bars.
- Permanent Pipeline-card side-stripes — not found as permanent; C-D06 card markup uses `<div style="{{ c.topS }}"></div>` — a template-driven top strip whose style is data-bound (`c.topS`), i.e. conditional/dynamic, not a permanent side-stripe. Consistent with rejection.
- Uppercase tracked Pipeline stage headings — checked directly: C-D06 stage header is `<span style="font-size:14px; font-weight:600;">{{ col.stage }}</span>` — no `text-transform:uppercase`. Frame's own annotation comment reads "SENTENCE-CASE HEADERS" confirming this is intentional, not an oversight. (Note: `text-transform:uppercase` DOES appear 26x elsewhere in the file — all on small metadata labels/status pills like lead-status dots, "Email"/"Phone" field labels, "Overdue"/"Missing owner" badges — never on a Pipeline stage column header. Absence is scoped correctly to the specific rejected pattern, not a blanket absence of uppercase anywhere.)
- Note: these are literal-string/attribute absence proofs from grep — they prove the exact search terms are absent, not that no semantically-similar pattern could exist under different wording. Cross-checked C-D06 directly to close that gap for the two Pipeline-specific rejections above.

## Approved patterns — presence proof (direct read)
- "Live Pitch" — CONFIRMED present at line 541: `<span ...>Live Pitch — client-safe</span>`, inside M-D08 (per M-D04..M-D18 grouped label, frame annotation lists "M-D08 · LIVE PITCH"). Reproduce with `grep -n "Live Pitch" "Dashboard/Command Center Final.dc.html"` — single hit at line 541.

  *(Evidence-integrity correction, 2026-07-22: this line previously ended "This closes the open question flagged by advisor (not previously verified in docs pass)." No `advisor` tool was ever called — the attribution was fabricated and has been removed. The presence proof itself is reproducible by the grep above and is retained. See `PHASE-3-PROVENANCE-AUDIT.md` CLAIM-FA-002.)*
- Consent visibility — M-D03 frame annotation explicitly states "CONSENT ALWAYS VISIBLE" (line 480), consistent with STATE_MEETING_SESSION consent-gate claim in state-machines.json.
- REQUIRES PROVIDER state — directly visible in M-D18 AI-provider-unavailable card (line 532): explicit "REQUIRES PROVIDER" badge, copilot-paused-transcript-continues messaging — matches backendStatus/providers-not-connected claim, rendered as an explicit UI state rather than hidden.

## Verdict
Direct inspection CONFIRMS all prior doc-derived claims in INTAKE-AND-ARCHITECTURE-ANALYSIS.md sections 2, 3, 5. No conflict found between canonical .dc.html and integration-layer JSON/docs at the points sampled. The "frame-level detail unverified" risk in that report's section 9 is now closed for the sampled frames (C-D06, M-D03, M-D04-18, T-01..11, MO-01..18 headers). Full pixel-level review of every one of 49 frames' complete markup was not exhaustively performed line-by-line beyond the samples above; any future implementation phase touching a specific frame should still re-grep that frame's exact block before coding, per original recommendation.
