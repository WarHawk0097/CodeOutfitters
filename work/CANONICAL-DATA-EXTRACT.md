# Canonical data + style extract — C-D01 / C-D05

Source of truth: `F:\CodeOutfitters\Dashboard\Command Center Final.dc.html`
- C-D01 Overview markup: lines 30–81
- C-D05 Leads markup: lines 134–201
- Shared data model (`<script type="text/x-dc">`): lines ~1310–1400

Extracted verbatim so implementation and mock fixtures can be aligned to the
canonical demo values. **Do not paraphrase these values** — the visual
comparison harness diffs rendered pixels, so any data drift reads as a
permanent visual failure that no amount of styling can close.

---

## Palette constant `G` (line 1311)

```js
const G={ink:'#14130E',cv:'#EDF0F2',ln:'#D9DFE2',sf:'#EEF1F3',tx:'#1B2226',
  t2:'#5A6B74',t3:'#7A868D',gr:'#2F7D4F',grI:'#276B42',grT:'#E2F0E7',grB:'#BFDCCA',
  am:'#B07C24',amI:'#8A5F17',amT:'#F4EBD4',rd:'#A63D2B',rdI:'#8C3021',rdT:'#F6E3DD',
  bl:'#46708E',blI:'#33566E',blT:'#E3EDF4',nt:'#85826F'};
```

Additional literals used inline (not in `G`, but canonical):
`#3E4A52` body-strong text · `#55636B` column-label · `#CDD5D9` control border ·
`#B9C2C7` muted glyph/checkbox · `#F1F4F5` input fill · `#F4F7F8` table header/footer ·
`#E7EBED` skeleton bar · `#212528` bulk bar + active page chip · `#8B979D` chart grey ·
`#D9A94E` chart amber · `#96731F` negotiation dot · `#E2E7EA` card inner divider.

## Navigation (line 1312)

```js
const NAV=[['label','OPERATIONS'],['Overview','ov',null],['Leads','ld','12'],
 ['Pipeline','pl',null],['Appointments','ap','3'],['Meeting Intelligence','mi','2'],
 ['Proposals','pr','3'],['Follow-ups','fu','4'],['Email Activity','em','2'],
 ['label','ADMINISTRATION'],['Team','tm',null],['Settings','st',null]];
const BC={'12':'#8FBF9B','3':'#6B6754','2':'#D98C7B','4':'#D9A94E'};
```

Badge colour exception: `Meeting Intelligence` badge `2` uses `#8FBF9B`, not `BC['2']`.

Sidebar: `width:248px; background:#14130E; padding:24px 0 16px; font-family:'Geist'`.
Nav row: `height:37px; padding:0 26px; font-size:13.5px;` inactive `#A19C8B`,
active `#F4F1E6` + `font-weight:500; box-shadow:inset 2px 0 0 #5C9B6C;`.
Group label: `padding:14px 26px 8px; font-size:10px; font-weight:600; color:#57533F; letter-spacing:.16em;`.
Logo: `Code<b>Outfitters</b>` 16px `#F4F1E6`; sub `COMMAND CENTER` 9.5px `#6B6754` `letter-spacing:.22em`.
Collapse row (C-D01 only): `height:36px; padding:0 26px; color:#6B6754; font-size:12.5px;`
with 15×15 icon `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>` stroke-width 1.75.
User card: 30×30 `border-radius:7px; background:#3D5B45; color:#DCEFE0; font-size:11.5px; font-weight:600;` "MR";
name 12.5px `#E8E4D6` weight 500; role 10.5px `#6B6754`; top border `1px solid #26231A`.

---

## C-D01 Overview

### Frame / shell
Frame `1440×1000; background:#EDF0F2; border:1px solid #CDD5D9; overflow:hidden`.
Header `height:56px; background:#fff; border-bottom:1px solid #D9DFE2; padding:0 24px; gap:16px`.
- Title `Overview` 16px/600; meta `Tuesday, April 22 · 4 items need attention · next meeting in 1h 20m` 11.5px `#7A868D`.
- Search: `width:300px; height:36px; background:#F1F4F5; border:1px solid #D9DFE2; border-radius:6px; padding:0 12px`, placeholder `Search…` 13px, `⌘K` kbd.
- Range toggle `7D / 30D / 90D`, active `30D` = `background:#212528; color:#fff; font-weight:600`, mono 11px, `padding:8px 12px`.
- Bell icon 17×17 stroke `#3E4A52` sw 1.75; avatar 32×32 `border-radius:7px; background:#3D5B45`.

Content region: `flex:1; padding:12px 24px 14px; overflow:hidden; display:flex; flex-direction:column`.

### KPI strip — ONE bordered container, cells touch
`display:grid; grid-template-columns:repeat(4,1fr); background:#fff; border:1px solid #D9DFE2; border-radius:8px; overflow:hidden; margin-bottom:14px;`
Cell padding `16px 20px`; cells 2–4 add `border-left:1px solid #E2E7EA`. **No gap between cards.**
Label 11px/700 `#55636B` `letter-spacing:.1em`; value mono 32px/600 `line-height:1; margin-top:10px`;
context 11.5px `#7A868D; margin-top:8px`. Pill: mono 10.5px/600 `border-radius:4px; padding:1px 6px`.

```js
kpis=[
 {l:'NEW LEADS',v:'34',vc:G.tx,p:'+18%',   ps:pill(G.grI,G.grT,G.grB), c:'12 this week · Google brand is top source'},
 {l:'AWAITING CONTACT',v:'9',vc:G.tx,p:'ACTION', ps:pill(G.amI,G.amT,'#E5D3A1'), c:'oldest waiting 6h — Dana Whitfield'},
 {l:'APPOINTMENTS',v:'7',vc:G.tx,p:'3 TODAY', ps:pill(G.blI,G.blT,'#C6D8E4'), c:'next in 1h 20m · Alicia F. · 10:00 AM'},
 {l:'OVERDUE FOLLOW-UPS',v:'4',vc:G.rd,p:'+2', ps:pill(G.rdI,G.rdT,'#E8C4B8'), c:'3 owned by Priya · 1 unassigned · 68% booking completion'}];
```

### Content grid — ROOT CAUSE of "unused region"
`display:grid; grid-template-columns:1fr 372px; grid-template-rows:minmax(0,1fr); gap:14px; flex:1; min-height:0;`
- Left column: `display:flex; flex-direction:column; gap:18px;` → **Lead Flow**, **Today's work**
- Right rail (372px fixed): `gap:14px; height:100%;` → **Pipeline Journey**, **Meetings & proposals**, **Recent activity** (last one `flex:1; min-height:0; overflow:hidden`)

### Lead Flow (three series)
Header 15px/600 `Lead Flow`; sub 12px `#7A868D`:
`How new inquiries move from received to contacted and won · Mar 3 – Apr 22 vs prior period`
Inline stats (mono 17px/600, label 10.5px `#7A868D`): `34 received` · `26 contacted` (`#8A5F17`) · `12 won` (`#276B42`) · `35% recv→won · ▲4.2pp` (`#276B42`).

```js
X=[46,248,450,652,854,1056];
recv=[30,38,25,46,35,48]; cont=[19,25,16,33,26,34]; won=[4,7,3,9,6,12];
y=v=>200-v*3.9;
flowLabels=['Mar 3','Mar 17','Mar 31','Apr 7','Apr 14','This wk'];
```
SVG `width:100%; height:160; viewBox="0 0 1090 212"; preserveAspectRatio="none"; padding:2px 10px 0`.
- area  `fill:#5A6B74; opacity:.12`
- recv  `stroke:#8B979D; stroke-width:1.75`
- cont  `stroke:#D9A94E; stroke-width:2.25`
- won   `stroke:#2F7D4F; stroke-width:2.5` + `circle r=3.5 fill:#2F7D4F` per point
Axis labels mono 10px `#7A868D`, `padding:2px 26px 5px`.
Legend 11.5px `#5A6B74`, swatches `10px×3px`; right-aligned mono 10px `#8B979D`
`76% CONTACT RATE · 35% WIN RATE`.

### Today's work
Header `Today's work` 15px/600 + mono 11px `#7A868D` `· 7 open`; right `View queue` 12px/600 `#2F7D4F`.
Row: `height:40px; padding:0 18px; gap:14px; border-bottom:1px solid #EEF1F3`;
8×8 `border-radius:2px` dot; title 13.5px/600; meta 12px `#7A868D`;
tag mono 10px/600 `letter-spacing:.08em`; CTA 12px/600 `border:1px solid #CDD5D9; border-radius:5px; padding:5px 10px`.

```js
wq=[
 {t:'Call Ruben Ortega — first contact',        m:'Northwind Logistics · overdue since yesterday',            tag:'OVERDUE',  tc:G.rd, cta:'Open'},
 {t:'Review discovery meeting — Priyanka Rao',  m:'Solterra Energy · transcript + CRM recommendations ready', tag:'REVIEW',   tc:G.bl, cta:'Review'},
 {t:'Proposal follow-up — Gregory Mullins',     m:'Harbor & Co · viewed yesterday, expires Friday',           tag:'DUE TODAY',tc:G.am, cta:'Open'},
 {t:'Appointment — Alicia Fenwick',             m:'Bright Harbor Realty · 10:00 AM PST · prepare questions',  tag:'TODAY',    tc:G.gr, cta:'Prepare'}];
```

### Pipeline Journey (right rail)
Title 15px/600; sub 11.5px `#7A868D` `86 active · 6 phases · all 11 statuses inside`.
Row: `padding:7px 16px; gap:12px; border-top:1px solid #EEF1F3`; left bar `width:6px; height:30px; border-radius:3px`;
name 13px/600; count mono 11px `#5A6B74`; sub 11px `#7A868D` `{conv} · avg {age}`;
alert `10.5px/600 color:#8A5F17; background:#F4EBD4; border-radius:4px; padding:2px 7px`.
Footer `padding:7px 16px 8px; border-top:1px solid #EEF1F3; font-size:11px; color:#7A868D`:
`Hover or expand a phase for its exact statuses → C-D04`

```js
mkPhase(n, c, count, conv, age, alert, segs, hot)
phases=[
 mkPhase('Intake',      G.bl,'25','entry phase',           '1.1 days', null),
 mkPhase('Appointment', G.am,'16','74% from Intake',       '2.0 days','3 waiting > 48h', ..., true),
 mkPhase('Discovery',   G.bl,'8', '62% from Appointment',  '3.4 days', null),
 mkPhase('Proposal',    G.am,'13','81% from Discovery',    '4.2 days','2 unviewed 5+ days'),
 mkPhase('Decision',    G.am,'5', '38% from Proposal',     '6.5 days', null),
 mkPhase('Outcome',     G.gr,'19','63% win rate',          '—',        null)];
```

### Meetings & proposals
Title 13px/600 `padding:12px 16px; border-bottom:1px solid #E2E7EA`.
Two rows, `padding:11px 16px; gap:11px`; 30×30 `border-radius:6px` icon tile.
1. video icon, tile `background:#E3EDF4; color:#33566E` — `2 meetings need review` /
   `Solterra discovery · Northwind no-show` / action `Review`
2. file icon, tile `background:#E2F0E7; color:#276B42` — `3 proposals awaiting action` /
   `1 internal review · 1 viewed · 1 expiring Fri` / action `Open`
Row title 12.5px/600; sub 11px `#7A868D`; action 11.5px/600 `#2F7D4F`.

### Recent activity
Title 13px/600. Row `padding:6px 16px; gap:11px; border-bottom:1px solid #EEF1F3`;
8×8 dot `border-radius:2px; margin-top:4px`; text 12px `#3E4A52; line-height:1.45`;
time mono 10px `#8B979D`.

```js
act=[
 {t:'Meeting analysis ready — Solterra discovery (14 requirements, 2 objections)', time:'32m', color:G.bl},
 {t:'Proposal PRO-2031 viewed by Harbor & Co (3rd view)',                          time:'1h',  color:G.gr},
 {t:'Confirmation email delivered to Dana Whitfield',                              time:'2h',  color:G.gr},
 {t:'Abandoned-booking reminder failed for Ruben Ortega',                          time:'5h',  color:G.rd},
 {t:'Priya moved Derrick Vaughn to Negotiation',                                   time:'1d',  color:G.nt}];
```

---

## C-D05 Leads

### Header
Title `Leads` 16px/600; meta `128 total · 12 new this week · 9 awaiting first contact` 11.5px `#7A868D`.
Actions gap 10px:
- `Columns ▾` — 12.5px/600 `color:#276B42; background:#E2F0E7; border:1px solid #BFDCCA; border-radius:6px; padding:8px 13px`
- `Export CSV` — 12.5px/600 `color:#fff; background:#2F7D4F; border-radius:6px; padding:8px 13px`

Content `flex:1; padding:20px 24px; overflow:hidden`.

### Toolbar (`border-radius:8px 8px 0 0`, `padding:12px 16px`, `gap:9px`)
- Search `width:240px; height:34px; background:#F1F4F5; border:1px solid #D9DFE2; border-radius:6px; padding:0 11px`,
  13×13 magnifier stroke `#7A868D` sw 2, placeholder `Search name, email, company…` 12.5px.
- Pills `padding:7px 11px; border-radius:6px; font-size:12.5px`:
  inactive `color:#3E4A52; border:1px solid #CDD5D9` — `Status ▾`, `Owner ▾`, `Source ▾`, `Appointment ▾`, `Created · Last 30d ▾`
  active `Service · 2 ▾` — `font-weight:600; color:#276B42; background:#E2F0E7; border:1px solid #BFDCCA`
- `margin-left:auto` mono 11px `#7A868D` — `128 RESULTS`

Faceted popover (`top:52px; left:262px; width:238px; border-radius:8px; box-shadow:0 16px 36px rgba(20,26,30,.18); padding:8px; z-index:5`):
heading `SERVICE · FACETED COUNTS` 10px/700 `#55636B` `letter-spacing:.08em`;
rows `padding:6px 8px; gap:9px`, box 14×14 `border-radius:3px` (checked `background:#2F7D4F`, unchecked `border:1.5px solid #B9C2C7`),
label 12.5px, count mono 10.5px `#7A868D`:
`AI Automation 21` ✓ · `Workflow Automation 17` ✓ · `Web Applications 14` ☐;
footer `Clear` 11.5px/600 `#5A6B74` `border-top:1px solid #EEF1F3`.

### Filter chips row
`border-left/right:1px solid #D9DFE2; padding:0 16px 12px; gap:8px; flex-wrap:wrap`.
`FILTERS:` 11px/600 `#7A868D`; chips 11.5px/600 `color:#276B42; background:#E2F0E7; border:1px solid #BFDCCA; border-radius:5px; padding:4px 8px`:
`Service: AI Automation ✕`, `Service: Workflow ✕`, `Created: Last 30d ✕`; `Reset all` 11.5px/600 `#A63D2B`.

### Bulk bar
`background:#212528; color:#F2F5F6; padding:9px 16px; gap:14px`.
`2 SELECTED` mono 11.5px/600; divider `width:1px; height:14px; background:#3B4248`;
actions 12px `#D5DBDE`: `Assign`, `Change status`, `Schedule follow-up`, `Export`;
`Clear` 12px `#7A868D` `margin-left:auto`.

### Table
Grid (header + every row): `grid-template-columns:38px 1.5fr .95fr 1.1fr .95fr .9fr .75fr .6fr 34px; gap:12px`.
Header `background:#F4F7F8; padding:10px 16px; border-bottom:1px solid #D9DFE2`;
labels 10.5px/700 `letter-spacing:.08em`, sorted `LEAD ↑` is `#276B42`, others `#55636B`.
Columns: ☐ · LEAD ↑ · SERVICE · STATUS · OWNER · APPOINTMENT · NEXT STEP · CREATED · (blank 34px).

Row `height:42px; padding:0 16px; border-bottom:1px solid #EEF1F3; background:{selBg}`.
- checkbox 14×14 `border-radius:3px; border:1.5px solid {cb}; background:{cbBg}`
- lead cell: name 13px/600 + company 11px `#7A868D`, both `text-overflow:ellipsis`, `align-items:baseline; gap:8px`
- service 12px `#3E4A52`
- status: `i` 8×8 `border-radius:2px; background:{dot}` + label 10.5px/600 `#3E4A52` `letter-spacing:.04em; text-transform:uppercase`
- owner: 20×20 `border-radius:5px; background:#EEF2F0; color:#276B42; font-size:8.5px; font-weight:700` initials + name 12px `#3E4A52`
- appointment 11.5px `#5A6B74`
- next step 12px, `color:{nk}`, `font-weight:{nw}` (data-driven)
- created mono 10.5px `#7A868D`
- row action `↗` `color:#B9C2C7`

Skeleton row (rendered as the last row): same grid, `height:42px`, bars `height:9px; background:#E7EBED; border-radius:3px`,
widths `72% · 60% · 55% · 58% · 50% · 46% · 60%`.

Footer `padding:11px 16px; background:#F4F7F8`; left mono 11px `#7A868D` `1–10 OF 128 · LOADING PAGE 2…`;
right `gap:5px`: `Prev` 12px `#8B979D` bordered · `1` active mono 11.5px/600 `#fff` on `#212528` · `2`,`3`,`13` mono 11.5px `#3E4A52` bordered ·
`…` mono 11.5px `#8B979D` · `Next` 12px/600 `#3E4A52` `border:1px solid #CDD5D9`.

### Status colour map — 11 statuses (line ~1362)
```js
const ST={'New':[G.bl],'Contacted':[G.nt],'Appt Pending':[G.am],'Appt Scheduled':[G.gr],
 'Discovery Done':[G.bl],'Proposal Req.':[G.am],'Proposal Sent':[G.bl],
 'Negotiation':['#96731F'],'Won':[G.gr],'Lost':[G.rd],'Follow Up Later':[G.nt]};
```

### Lead rows (line 1363) — `[name, company, service, sourcePath, status, owner, appointment, last, next, created, urgency]`
```js
['Dana Whitfield',  'Meridian Dental Group',  'AI Automation',       '/services/ai-automation',   'New',             'Unassigned', 'Not started','—',     'Today',     '2h', 1],
['Ruben Ortega',    'Northwind Logistics',    'Workflow Automation', '/services/workflow',        'Appt Pending',    'Priya Nair', 'Abandoned',  '1d ago','Overdue',   '6h', 2],
['Alicia Fenwick',  'Bright Harbor Realty',   'Web Applications',    '/work',                     'Appt Scheduled',  'Priya Nair', 'Scheduled',  '2d ago','Apr 24',    '1d', 0],
['Thomas Beck',     'Cascade Fitness',        'AI Agents',           '/services/ai-agents',       'Contacted',       'Marc Rivera','Not started','3h ago','Apr 25',    '2d', 0],
['Priyanka Rao',    'Solterra Energy',        'Custom Software',     '/services/custom-software', 'Discovery Done',  'Marc Rivera','Completed',  '1d ago','Review mtg','4d', 3],
['Gregory Mullins', 'Harbor & Co Accounting', 'Integrations',        '/services/integrations',    'Proposal Sent',   'Priya Nair', 'Completed',  '5h ago','Tomorrow',  '5d', 1],
['Sofia Marchetti', 'Verano Hospitality',     'AI Automation',       '/',                         'Proposal Req.',   'Marc Rivera','Completed',  '2d ago','Apr 28',    '8d', 0],
['Derrick Vaughn',  'Ironclad Security',      'Business Systems',    '/work',                     'Negotiation',     'Priya Nair', 'Completed',  '1d ago','Apr 23',   '11d', 0],
['Hannah Liu',      'Petal & Stem',           'Web Applications',    '/services/web-apps',        'Won',             'Marc Rivera','Completed',  '3d ago','—',        '18d', 0],
['Elena Sokolova',  'Lumen Health',           'AI Agents',           '/services/ai-agents',       'Follow Up Later', 'Marc Rivera','Not started','9d ago','Jun 15',   '29d', 0]];
```

Derived fields:
```js
oi = ow==='Unassigned' ? '—' : ow.split(' ').map(x=>x[0]).join('')   // owner initials
nk = r[10]===2 ? '#8C3021' : r[10]===1 ? '#8A5F17' : r[10]===3 ? '#33566E' : '#3E4A52'  // next-step colour
nw = r[10] ? '600' : '400'                                            // next-step weight
sel = i===1 || i===2;  selBg = sel ? '#EAF2ED' : '#fff'
cb  = sel ? '#2F7D4F' : '#B9C2C7';  cbBg = sel ? '#2F7D4F' : '#fff'
```
Urgency legend: `0` normal · `1` amber (`#8A5F17`) · `2` red (`#8C3021`) · `3` blue (`#33566E`).

---

## Contract conflict — MUST be resolved, not silently interpreted

`packages/contracts/src/leads.ts` `LeadStatusSchema` is a **6-value** enum
(`New, Contacted, Qualified, Won, Lost, FUL`). Canonical C-D05 renders **11**
statuses (the `ST` map above). `Qualified` does not appear in canonical at all.

Per `Dashboard/CANONICAL-AUTHORITY.md`: *visual conflict → canonical `.dc.html`
frame wins; data/state conflict → validated integration-layer JSON wins;
unresolved conflict → report, never silently interpret.*

The 11-status list is **not** present in any `integration-layer/*.json`
(searched `entities.json`, `sections.json`, `components.json`,
`state-machines.json`). `STATE_PIPELINE_MOVE` corroborates the *existing*
contract by naming `confirm_reason(Won/Lost/FUL)` as its terminal stages.

So this is a genuine unresolved conflict between two authorities and it is
**reported, not invented**. See `PHASE-3-IMPLEMENTATION-REPORT.md`.
