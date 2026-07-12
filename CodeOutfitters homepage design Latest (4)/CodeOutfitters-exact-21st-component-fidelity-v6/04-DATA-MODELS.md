# 04 — Data Models

TypeScript interfaces for `data/*.ts`. All sample data below is real CodeOutfitters copy pulled directly from the approved design files in `/design-preview/` — not generic demo data, and contains no pricing figures.

```ts
// data/site.ts
export interface NavItem {
  label: string;
  href: string; // one of the 8 approved routes only
}

export const navItems: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Process", href: "/process" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
];

export const footerNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Process", href: "/process" },
  { label: "Security & Reliability", href: "/security" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
```

```ts
// data/services.ts
export interface ServiceItem {
  id: string;            // used for #anchor + search matching
  num: string;            // "01".."06"
  name: string;
  icon: string;            // path under /public/icons
  pillLabel: string;       // e.g. "Most popular"
  pillTone: "green" | "gold";
  metric: string;          // headline stat, e.g. "26s avg reply"
  desc: string;
  tags: string[];
  steps: string[];         // "How it works" expandable steps
}

export const services: ServiceItem[] = [
  { id: "whatsapp", num: "01", name: "WhatsApp Lead Automation", icon: "/icons/icon-chat-square.svg", pillLabel: "Most popular", pillTone: "green", metric: "26s avg reply",
    desc: "Every inbound lead gets qualified, answered, and booked in seconds — while your CRM stays in sync.",
    tags: ["Qualifies in 30s", "Books to calendar", "Syncs to CRM"],
    steps: ["Connect your WhatsApp Business number", "Train the bot on your services and pricing", "Leads get answered, qualified, and booked automatically"] },
  { id: "email", num: "02", name: "Email Workflow Automation", icon: "/icons/icon-edit-square.svg", pillLabel: "Nurture", pillTone: "gold", metric: "68% open rate",
    desc: "Smart sequences that nurture prospects, onboard clients, and re-engage customers automatically.",
    tags: ["Auto-tagging", "Multi-step sequences", "CRM sync"],
    steps: ["Map your current nurture / onboarding emails", "Build triggers off signups, purchases, and inactivity", "Sequences run and report automatically every week"] },
  { id: "support", num: "03", name: "Support Chat Systems", icon: "/icons/icon-ai-agent-face.svg", pillLabel: "Always on", pillTone: "green", metric: "214 FAQs/mo",
    desc: "Intelligent chatbots that answer questions, collect data, and route hot leads to your team.",
    tags: ["Answers FAQs", "Routes hot leads", "24/7 coverage"],
    steps: ["Feed the bot your docs, FAQs, and policies", "Set routing rules for when a human should step in", "Bot goes live on your site or socials, answering instantly"] },
  { id: "booking", num: "04", name: "Booking & Scheduling Bots", icon: "/icons/icon-check-square.svg", pillLabel: "Calendar", pillTone: "green", metric: "90% fewer calls",
    desc: "An AI receptionist that books, reschedules, and reminds — synced straight to your calendar.",
    tags: ["Calendar sync", "Auto reminders", "No double-books"],
    steps: ["Connect your booking calendar and service list", "Set availability rules and buffer times", "Clients book, reschedule, and get reminders hands-free"] },
  { id: "invoice", num: "05", name: "Invoice & Order Automation", icon: "/icons/icon-database-stack.svg", pillLabel: "Back office", pillTone: "gold", metric: "97% time saved",
    desc: "Orders become invoices automatically, reconciled against payments with zero manual entry.",
    tags: ["Auto invoicing", "Payment matching", "Error-free"],
    steps: ["Connect your store, invoicing, and accounting tools", "Define invoice templates and approval rules", "Orders flow straight through to paid, reconciled invoices"] },
  { id: "custom", num: "06", name: "Custom Integration Builds", icon: "/icons/icon-orchestrate.svg", pillLabel: "Bespoke", pillTone: "green", metric: "120+ shipped",
    desc: "Got a workflow that does not fit a template? We design and ship a bespoke automation around it.",
    tags: ["Any stack", "Fixed quote", "7-day build"],
    steps: ["Discovery call to map your exact workflow", "We scope architecture, timeline, and fixed cost", "Build, test, and hand off with 30 days of support"] },
];
```

```ts
// data/industries.ts
export interface IndustryItem {
  name: string;
  icon: string;
  problems: string;     // common-problems paragraph
  examples: string[];   // "what we automate" chips
  tools: string;        // tools we connect to, prose
}

export const industries: IndustryItem[] = [
  { name: "Home Services / HVAC", icon: "/icons/icon-automate.svg",
    problems: "Missed calls after hours, slow quote turnaround, techs double-booked or no-showed.",
    examples: ["Missed-call text-back", "Auto quote follow-up", "Dispatch reminders"],
    tools: "ServiceTitan, Housecall Pro, Jobber, Google Calendar" },
  { name: "Healthcare Clinics / Med-Spas", icon: "/icons/icon-chat-square.svg",
    problems: "No-shows eating schedule capacity, intake forms chased down manually, staff buried in reminder calls.",
    examples: ["Appointment reminders", "Digital intake routing", "Rebooking nudges"],
    tools: "Calendly, Square Appointments, EHR exports, SMS" },
  { name: "Real Estate", icon: "/icons/icon-lead-user.svg",
    problems: "Leads go cold waiting for a reply, showings scheduled by phone tag, paperwork chased by hand.",
    examples: ["Instant lead qualification", "Showing scheduling", "Document follow-up"],
    tools: "CRMs, DocuSign, MLS feeds, WhatsApp" },
  { name: "E-commerce / Retail", icon: "/icons/icon-database-stack.svg",
    problems: "Order and invoice entry done by hand, support inbox flooded with the same order questions.",
    examples: ["Order-to-invoice sync", "Order status auto-replies", "Returns triage"],
    tools: "Shopify, QuickBooks, Stripe, Zendesk" },
  { name: "Professional Services", icon: "/icons/icon-edit-square.svg",
    problems: "Client onboarding scattered across email, proposals and invoices tracked in spreadsheets.",
    examples: ["Client onboarding sequences", "Proposal-to-invoice handoff", "Status update emails"],
    tools: "Gmail/Outlook, Notion, QuickBooks, DocuSign" },
  { name: "Education / Training", icon: "/icons/icon-check-square.svg",
    problems: "Enrollment questions answered one-by-one, cohort reminders sent manually, certificates issued by hand.",
    examples: ["Enrollment chat answers", "Cohort reminder sequences", "Certificate delivery"],
    tools: "Kajabi, Teachable, Mailchimp, Google Sheets" },
  { name: "Local Service Businesses", icon: "/icons/icon-orchestrate.svg",
    problems: "Booking requests come in on five different channels and get lost between them.",
    examples: ["Unified booking intake", "Review request automation", "No-show follow-up"],
    tools: "WhatsApp, Instagram DMs, Google Business, Calendly" },
];
```

```ts
// data/process.ts
export interface ProcessStep {
  n: number;
  label: string;      // "Step 1" / "30-Day Support"
  title: string;
  desc: string;
  isSupportStep?: boolean; // true for the final "30-Day Support" node (different node styling)
}

export const processSteps: ProcessStep[] = [
  { n: 1, label: "Step 1", title: "Discovery Call", desc: "A free 30-minute call where we map how the work happens today and find your biggest time drains." },
  { n: 2, label: "Step 2", title: "Workflow Audit", desc: "We dig into your actual tools and steps — no assumptions — to understand exactly what needs to connect to what." },
  { n: 3, label: "Step 3", title: "Fixed-Scope Proposal", desc: "You receive a clear, written proposal — exact deliverables, timeline, and cost. No packages, no guessing." },
  { n: 4, label: "Step 4", title: "Build Phase", desc: "We build against the approved scope, integrating with the tools you already use — you get progress updates, not surprises." },
  { n: 5, label: "Step 5", title: "Testing & Handoff", desc: "We test against real scenarios before anything goes live, then hand off with documentation your team can actually use." },
  { n: 6, label: "30-Day Support", title: "Live & Supported", desc: "30 days of support included after launch — we monitor, fix, and fine-tune as your team gets used to the new system.", isSupportStep: true },
];
```

```ts
// data/security.ts
export interface SecurityPractice {
  title: string;
  desc: string;
  span: "half" | "full"; // maps to bento column span
}

export const accessPractices: SecurityPractice[] = [
  { title: "Least-access setup", span: "full", desc: "Every integration is connected with the minimum permissions needed to do its job — not broad, all-access keys by default. Access is easy to review, and easy to revoke." },
  { title: "Server-side secrets", span: "half", desc: "API keys and credentials are kept server-side wherever the platform allows it, rather than exposed in client-facing code." },
  { title: "Scoped account access", span: "half", desc: "We use dedicated integration accounts where possible, so access can be reviewed or revoked without touching your main tools." },
];

export const reliabilityPractices: SecurityPractice[] = [
  { title: "Monitoring mindset", span: "half", desc: "We check in on live automations during the support window and flag anything behaving unexpectedly before it becomes your problem." },
  { title: "Documented handoff", span: "half", desc: "Every project ends with documentation of what was built, how it works, and who to contact — not tribal knowledge." },
  { title: "Clear rollback plan", span: "full", desc: "If something needs to be paused or reverted, that path is documented up front — not figured out under pressure. Every handoff includes the exact steps." },
];
```

```ts
// data/case-studies.ts
export interface CaseMetric { num: string; label: string; }

export interface CaseStudy {
  industry: string;
  system: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  metrics: CaseMetric[];
  isSample: true; // always true — every case study must be labeled "Sample project" in the UI
}

export const caseStudies: CaseStudy[] = [
  { industry: "Real Estate", system: "WhatsApp Automation", isSample: true,
    title: "How a Real Estate Agency Doubled Lead Response Rate",
    summary: "A 3-agent office was losing leads to faster competitors. We built a WhatsApp bot that qualifies, responds, and books viewings 24/7.",
    problem: "Leads emailed or texted after hours went unanswered until the next morning — by then, competing agencies had often already booked the viewing.",
    solution: "A WhatsApp bot now answers instantly, qualifies buyer intent, checks listing availability, and books viewing slots straight into the team calendar.",
    metrics: [{ num: "2x", label: "Response rate" }, { num: "87%", label: "Faster follow-ups" }, { num: "18 hrs", label: "Saved / week" }] },
  { industry: "E-commerce", system: "Invoice Automation", isSample: true,
    title: "Invoice Processing Reduced from 4 Hours to 8 Minutes Daily",
    summary: "An online retailer was manually creating invoices and reconciling orders. Our pipeline now handles 200+ invoices per day, error-free.",
    problem: "A single ops person spent close to half her day copying order data into invoices and manually checking payments against orders.",
    solution: "Orders now flow automatically into templated invoices, matched against incoming payments, with exceptions flagged for a quick human check.",
    metrics: [{ num: "97%", label: "Time saved" }, { num: "0", label: "Data-entry errors" }, { num: "$1,200", label: "Saved / mo" }] },
  { industry: "Healthcare", system: "Booking Bot", isSample: true,
    title: "Medical Clinic Eliminates 90% of Phone-Based Scheduling",
    summary: "A busy clinic was overwhelmed by appointment calls. We deployed an AI booking bot that syncs with their calendar and sends reminders automatically.",
    problem: "Front-desk staff spent most of the day on the phone booking and rebooking appointments, with no time left for patients in the office.",
    solution: "An AI booking bot now handles scheduling by chat, checks real-time calendar availability, and sends automatic reminder texts to cut no-shows.",
    metrics: [{ num: "90%", label: "Fewer calls" }, { num: "40%", label: "Drop in no-shows" }, { num: "24/7", label: "Booking" }] },
  { industry: "Legal", system: "Intake Automation", isSample: true,
    title: "Law Firm Cuts Client Intake From Half a Week to Minutes",
    summary: "A busy practice had a paralegal manually processing every new client intake form by hand, delaying case starts.",
    problem: "New client intake — forms, conflict checks, document requests — consumed a significant chunk of a paralegal's week, and nothing moved forward until it was done.",
    solution: "An automated intake flow now collects client information, runs conflict checks, and requests missing documents the moment a new client signs on.",
    metrics: [{ num: "80%", label: "Faster intake" }, { num: "0", label: "Missed forms" }, { num: "12 hrs", label: "Saved / week" }] },
  { industry: "Logistics", system: "Dispatch Automation", isSample: true,
    title: "Logistics Company Automates Dispatch in Six Days",
    summary: "A regional carrier was coordinating drivers and jobs through phone calls and spreadsheets, with no reliable record of what was assigned.",
    problem: "Dispatch decisions lived in one coordinator's head and a shared spreadsheet — assignments were slow, and nothing was tracked automatically.",
    solution: "We mapped the full dispatch workflow and built an automation that assigns jobs to available drivers and logs every assignment automatically.",
    metrics: [{ num: "35%", label: "Faster dispatch" }, { num: "100%", label: "Jobs logged" }, { num: "22 hrs", label: "Saved / week" }] },
  { industry: "Home Services", system: "WhatsApp Automation", isSample: true,
    title: "HVAC Company Triples Review Volume With an Automated Follow-Up",
    summary: "An HVAC business was quoting and booking jobs by phone, and rarely remembered to ask happy customers for a review.",
    problem: "Job quoting happened over scattered phone calls, and review requests were an afterthought that usually never got sent.",
    solution: "A WhatsApp bot now quotes common jobs instantly, books technicians into the calendar, and automatically follows up for a review after each job.",
    metrics: [{ num: "3x", label: "More reviews" }, { num: "24/7", label: "Quoting" }, { num: "15 hrs", label: "Saved / week" }] },
];
```

```ts
// data/faqs.ts
export interface FaqItem {
  page: "home" | "services" | "industries" | "process" | "security" | "contact";
  q: string;
  a: string;
}
// Populate from each page's FAQ list in 02-PAGE-BY-PAGE-SPEC.md — omitted here for brevity,
// copy verbatim from the corresponding source .dc.html `_faqs` array (exact text, do not paraphrase).
```

```ts
// data/testimonials.ts
export interface TestimonialItem {
  quote: string;
  who: string;
  isIllustrative: true; // always true — UI must show "Illustrative feedback" disclosure
}

export const testimonials: TestimonialItem[] = [
  { isIllustrative: true, quote: "We used to lose weekend leads to whoever replied first on Monday. Now the bot has already booked the viewing before I've had my coffee.", who: "Principal broker, 3-agent real estate office" },
  { isIllustrative: true, quote: "Invoicing used to be my entire afternoon. Now it's an eight-minute check of a dashboard, and I get my afternoons back.", who: "Operations lead, online retailer" },
  { isIllustrative: true, quote: "The front desk finally talks to the patients in the room instead of the ones on hold. That alone was worth the build.", who: "Practice manager, family clinic" },
];
```

```ts
// data/about.ts
export interface AboutBelief { title: string; icon: string; desc: string; }
export interface WorkPrinciple { num: string; title: string; desc: string; }

export const beliefs: AboutBelief[] = [
  { title: "Automation should disappear", icon: "/icons/icon-automate.svg", desc: "The best system is one your team stops noticing — it just quietly does the repetitive part." },
  { title: "Scope before code", icon: "/icons/icon-database-stack.svg", desc: "We map the real workflow before writing anything. Guessing at requirements wastes everyone's time." },
  { title: "Humans stay in the loop", icon: "/icons/icon-ai-agent-face.svg", desc: "AI handles the repetitive parts; anything sensitive or ambiguous gets routed to a person, by design." },
  { title: "Clear communication over jargon", icon: "/icons/icon-chat-square.svg", desc: "You should always know what was built, why, and how to get help — in plain language, not engineer-speak." },
];

export const howWeWork: WorkPrinciple[] = [
  { num: "01", title: "You talk, we listen", desc: "Discovery starts with your workflow, not our template." },
  { num: "02", title: "One point of contact", desc: "Clear communication throughout — no ticket queues." },
  { num: "03", title: "Documented handoff", desc: "You get real documentation, not tribal knowledge." },
  { num: "04", title: "Support after launch", desc: "30 days included to fix issues and fine-tune." },
];
```

```ts
// data/integrations.ts (used by Services + Security marquees)
export const toolsRow1: string[] = ["WhatsApp Business", "Gmail", "Outlook", "QuickBooks", "Stripe", "Shopify", "Calendly", "Google Calendar", "HubSpot"];
export const toolsRow2: string[] = ["Zapier", "Make", "Slack", "Notion", "DocuSign", "Twilio SMS", "Airtable", "Google Sheets", "Zendesk"];
```
