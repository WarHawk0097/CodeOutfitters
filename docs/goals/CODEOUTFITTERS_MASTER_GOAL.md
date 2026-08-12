# CodeOutfitters Master Goal

## 0. Document Purpose

This file is the authoritative implementation goal for turning the current CodeOutfitters application into a production-quality, AI-assisted custom-software sales operating system.

The objective is not to create isolated dashboard pages. The objective is to make the complete sales workflow work end-to-end with real persistence, real workspace isolation, real integrations, structured AI assistance, safe failure behavior, and automated verification.

A feature is **not complete** because a page, component, API handler, database table, mock, provider interface, or happy-path unit test exists.

A feature is complete only when:

1. the user-facing workflow exists;
2. the backend/service path exists;
3. data persists in Supabase where persistence is required;
4. the workflow survives a fresh authenticated session;
5. workspace isolation and RLS are verified;
6. live mode has no demo-data fallback;
7. failures are safe and visible;
8. integrations are idempotent where applicable;
9. automated tests cover expected and adversarial paths;
10. the production build succeeds;
11. any required external-provider configuration is explicitly documented and verified without fabricating secrets.

This goal must be executed incrementally, preserving working production behavior and existing security guarantees.

---

# 1. Product Vision

CodeOutfitters should operate as a connected sales operating system for a custom-software business.

The primary business loop is:

```text
Website inquiry / booking / manual lead / inbound email
                         ↓
                  Lead ingestion
                         ↓
               Deduplication + CRM
                         ↓
                    AI analysis
                         ↓
                 Sales pipeline
                         ↓
              Tasks / follow-ups
                         ↓
                  Email outreach
                         ↓
              Calendar scheduling
                         ↓
             External calendar event
                         ↓
            Meet / Zoom meeting link
                         ↓
             Meeting / transcript
                         ↓
                AI extraction
                         ↓
        Requirements + risks + next steps
                         ↓
          AI pipeline recommendation
                         ↓
             Proposal generation
                         ↓
          AI market-price analysis
                         ↓
        Internal recommended quotation
                         ↓
                  Human review
                         ↓
                  Proposal sent
                         ↓
            Email/SMS follow-up
                         ↓
              Won / Lost / Nurture
```

The core positioning is custom software tailored to the customer's business and workflow, not a generic "choose an automation" marketplace.

The public intake experience should ask what the customer's business does, what problem they are trying to solve, and what they want to build.

---

# 2. Scope

This master goal includes the following functional requirements.

## 2.1 Lead / CRM

1. Real lead ingestion.
2. Functional CRM sales pipeline.
3. Lead detail and customer context.
4. Meeting transcript → CRM intelligence.
5. AI-assisted pipeline/status/next-action recommendations.

## 2.2 Scheduling

6. Real-person calendar availability.
7. External calendar integration.
8. External meeting links instead of custom video conferencing.
9. Meeting/calendar reminders.

## 2.3 Messaging

10. Optional Twilio/SMS reminder capability with consent handling.
11. Email integration:
   - inbound message synchronization;
   - outbound email;
   - lead/thread matching;
   - proposal delivery;
   - follow-up drafting/sending;
   - email activity history;
   - AI analysis of relevant email content.

## 2.4 Public Intake / Positioning

12. Remove or replace "What are you looking to automate?" framing.
13. Add "Tell us about your business / what are you looking to build?" style intake.
14. Position CodeOutfitters around custom business software tailored to exact workflows.

## 2.5 Proposals

15. Attach proposals to leads/opportunities.
16. Generate proposals from meeting transcripts and accumulated lead context.
17. AI extraction of customer requirements from calls/emails/intake.
18. Human proposal review/preview/send workflow.
19. Professional proposal web/PDF presentation.

## 2.6 Pricing Intelligence

20. AI market-price estimate for a proposed project.
21. Internal CodeOutfitters recommended quote/pricing intelligence.

The original meeting-derived list had 20 items before Google Sign-In, Apple Sign-In, and domain work. Email integration is intentionally promoted here into a first-class requirement because it is now explicitly requested and materially affects lead ingestion, follow-up, proposal delivery, and AI context.

---

# 3. Explicit Exclusions

Do not implement the following as part of this master goal unless separately authorized:

- CEO in a Box financial-management requirements.
- personal assets/liabilities tracking.
- tax planning.
- Plaid/bank aggregation.
- rental-property financial management.
- QuickBooks financial import.
- CEO in a Box multi-tenant financial SaaS scope.
- Google Sign-In.
- Apple Sign-In.
- CodeOutfitters domain/DNS work.
- custom video conferencing.
- a custom Zoom/Meet replacement.
- electronic signature unless separately approved.
- Stripe/deposit/payment collection unless separately approved.
- autonomous customer-facing proposal sending without human approval.
- autonomous pricing changes without human approval.
- autonomous destructive CRM changes.
- broad unrelated refactors.
- cleanup of unrelated local files.
- weakening existing security tests, parity guards, RLS, or authorization to make implementation easier.

---

# 4. Known Project Baseline — Verify, Do Not Blindly Assume

The repository has an established Supabase-backed architecture and several live modules.

Known historical/live areas include:

- Overview / Leads data paths.
- Attachment downloads.
- AI Copilot infrastructure.
- Saved Views.
- Tasks.
- workspace-level Activity Feed.
- Search work in PR #10 at the time this goal was authored.
- production login/demo-mode middleware fix in PR #11.

The repository has existing patterns for:

- browser Supabase client;
- SSR/cookie-scoped server Supabase client;
- `requireDashboardContext()` / trusted workspace context;
- RLS;
- typed server providers;
- live/demo mode separation;
- Activity event emission;
- local Supabase integration testing.

There is also a known prior discrepancy:

- `/dashboard/leads` was observed to call a dead `/api/leads` path;
- Lead detail had a real data path.

Do not trust this summary as current truth.

**First action must be a fresh repository audit.**

---

# 5. Non-Negotiable Engineering Rules

## 5.1 Security

- Never use a service-role key in general dashboard flows.
- Dashboard reads/writes must use the authenticated user's server client.
- Workspace identity must be derived from trusted authenticated context.
- Never accept `workspace_id` from the browser as authoritative.
- Preserve RLS as the final data boundary.
- Never expose raw provider tokens to the browser.
- Encrypt sensitive integration refresh tokens/credentials server-side.
- Never print secrets in logs, tests, screenshots, or reports.
- Never touch production customer data for tests.
- Never fabricate provider credentials.
- Never weaken password policy.
- Never weaken existing RLS/security tests merely to unblock implementation.
- Never silently widen OAuth scopes.
- Request the minimum provider permissions needed for a feature.
- Any public proposal-access token must be high entropy, revocable, scoped, and tested against enumeration/IDOR.
- AI output is untrusted input until schema-validated.

## 5.2 Data Integrity

- All externally sourced events must be idempotent where providers can retry.
- Use provider IDs and unique constraints or equivalent deduplication.
- Do not mark an operation successful before the external side effect succeeds when success semantically depends on it.
- Example: if proposal email sending fails, proposal must not be marked "sent".
- Keep raw source material separate from AI interpretation.
- Keep facts separate from AI inference/recommendations.
- Do not silently overwrite historical proposal versions.
- Track pipeline transitions rather than only current stage.

## 5.3 AI Safety / Product Control

AI may automatically:

- summarize;
- classify;
- extract;
- recommend;
- draft;
- prioritize;
- identify missing information;
- generate structured proposal drafts;
- generate pricing ranges/recommendations.

AI must initially require human confirmation before:

- consequential pipeline moves when inference is involved;
- sending customer emails;
- sending proposals;
- sending non-transactional SMS;
- finalizing customer price;
- deleting or merging leads;
- modifying important customer facts.

Deterministic business logic should be used instead of AI when deterministic logic is sufficient.

Example:

```text
Booking successfully created
→ deterministic event/state update

Transcript says customer is ready for proposal
→ AI recommendation requiring human approval
```

## 5.4 Live / Demo Separation

For every live feature:

- zero fallback to demo fixtures on database/API/integration failure;
- empty live data must remain empty;
- failed live data must show a controlled error;
- live provider must not import `lib/demo` or equivalent demo fixtures;
- demo mode may remain separate and intentional.

---

# 6. Phase 0 — Strict Current-State Audit

Before implementing, produce a machine-verifiable audit of the current repository.

## 6.1 Git Safety

Report:

- current branch;
- HEAD;
- `origin/main` HEAD;
- `git status --short`;
- staged files;
- modified files;
- untracked files.

Do not delete, stash, clean, modify, stage, or commit unrelated residue.

Known unrelated residue may include admin reproduction files, zip files, QA scripts, System-Artifacts, work directories, or other local files.

## 6.2 Feature Audit Matrix

For each target domain, classify:

- LIVE_END_TO_END
- LIVE_BACKEND_ONLY
- LIVE_UI_ONLY
- DEMO_ONLY
- PROVIDER_REQUIRED
- BROKEN
- MISSING
- UNKNOWN

Audit:

- lead ingestion;
- Leads list;
- Lead detail;
- pipeline;
- Tasks;
- Activity;
- Search;
- appointments;
- calendar;
- meetings;
- transcripts;
- email activity;
- follow-ups;
- proposals;
- proposal public access;
- AI Copilot;
- AI workflow infrastructure;
- pricing intelligence.

For every classification cite exact files/routes/tables/tests.

## 6.3 Database Audit

Inspect:

- migrations;
- tables;
- foreign keys;
- indexes;
- RLS policies;
- grants;
- trigger functions;
- RPCs.

Do not assume new migrations are required.

Reuse existing schema when it is correct.

If a migration is required, it must be:

- minimal;
- additive where possible;
- RLS-complete;
- locally resettable;
- integration-tested;
- reviewed for indexes and foreign keys.

## 6.4 Existing Integration Audit

Inspect existing:

- Resend integration;
- booking worker;
- calendar provider abstractions;
- email provider abstractions;
- webhook handlers;
- Google/Zoom/Meet code;
- OAuth token storage;
- background job mechanisms.

Reuse correct existing infrastructure instead of duplicating it.

---

# 7. Domain Model Target

Do not create all of these tables blindly. Audit existing schema first.

The architecture should be able to represent these domains.

## 7.1 Leads / Organizations

Possible entities:

- `leads`
- `organizations` or company fields if separate organizations are justified
- `lead_sources`
- `lead_ingestion_events`
- `lead_context`
- `lead_stage_history`

Every lead must belong to a workspace.

Useful concepts:

```text
lead:
  id
  workspace_id
  first_name
  last_name
  work_email
  phone
  business_name
  website
  source_type
  source_detail
  owner_user_id
  current_stage
  created_at
  updated_at
  last_contacted_at
```

Only add columns that fit actual repository conventions.

## 7.2 Meetings / Appointments

Possible entities:

- `appointments`
- `meetings`
- `meeting_attendees`
- `meeting_transcripts`
- `meeting_ai_analysis`

Raw transcript must be preserved separately from analysis.

## 7.3 Integrations

Prefer a coherent integration abstraction rather than provider tokens scattered across unrelated tables.

Possible conceptual model:

```text
integration_connections:
  id
  workspace_id
  user_id
  provider
  connection_type
  status
  granted_scopes
  encrypted_credentials
  expires_at
  created_at
  updated_at
```

Provider-specific schema may be preferable if existing architecture already uses it.

## 7.4 Email

Possible entities:

- `email_connections`
- `email_threads`
- `email_messages`
- `email_participants`
- `email_sync_state`

Use provider message/thread IDs for idempotency.

## 7.5 Pipeline

Possible entities:

- `pipeline_stages`
- `lead_stage_history`

A transition should be traceable:

```text
lead_id
from_stage
to_stage
changed_by
change_source
reason
created_at
```

## 7.6 Proposals

Possible entities:

- `proposals`
- `proposal_versions`
- `proposal_publications`
- `proposal_access_links`
- `proposal_client_responses`

The repository may already contain several of these. Reuse and harden rather than replace.

## 7.7 AI

Possible entities:

- `ai_runs`
- `ai_recommendations`
- `ai_extractions`

Conceptual `ai_runs` fields:

```text
id
workspace_id
lead_id
workflow
model
prompt_version
input_hash
status
started_at
completed_at
token_usage
estimated_cost
error_code
```

Avoid storing unnecessary sensitive prompt content.

---

# 8. Lead Ingestion Engine

Lead ingestion is a critical acceptance area.

## 8.1 Initial Sources

Support at minimum where current product allows:

1. website inquiry;
2. booking;
3. manual dashboard creation;
4. inbound email or explicit email-to-lead workflow.

If a source cannot be fully activated because an external provider connection is not configured, implement the production-safe adapter and deterministic local/integration tests, document the external blocker, and do not fabricate a credential.

## 8.2 One Canonical Ingestion Path

Do not let each source independently implement lead creation rules.

Target:

```text
source
  ↓
LeadIngestionService
  ↓
normalize
  ↓
validate
  ↓
deduplicate
  ↓
create/update lead
  ↓
assign source
  ↓
initial pipeline stage
  ↓
activity event
  ↓
optional AI enrichment job
```

## 8.3 Normalization

Normalize safely:

- trim names;
- lowercase normalized email for matching;
- normalize phone number where feasible;
- canonicalize website/domain where useful;
- preserve original user-provided display values where appropriate.

## 8.4 Deduplication

Suggested rules:

### Strong automatic match candidates

- same normalized email;
- same normalized phone.

### Probable/ambiguous match candidates

- same name + business;
- same business domain + compatible identity.

Do not use name alone for automatic merge.

Do not let AI autonomously merge customer records.

A duplicate submission should usually create a new interaction/activity while reusing the existing lead.

## 8.5 Lead Source Attribution

Persist source information sufficient to answer:

- where did this lead come from?
- which inquiry/booking/email produced it?
- when was first touch?
- when was most recent touch?

Possible metadata:

```text
source_type
source_external_id
source_url
referrer
utm_source
utm_medium
utm_campaign
first_touch_at
last_touch_at
```

Only implement fields justified by actual intake sources.

## 8.6 Lead Ingestion Acceptance Tests

### Inquiry → lead

- submit a real local/test inquiry through the actual public intake path;
- verify one lead is persisted;
- verify source is correct;
- verify initial stage;
- verify it appears through live dashboard provider;
- refresh/fresh session still shows it;
- verify activity event if intended.

### Booking → lead

- create a booking with a new email;
- verify lead creation;
- verify appointment relationship.

### Existing lead booking

- create lead;
- book using same identity;
- verify no duplicate lead;
- appointment attaches to same lead.

### Manual lead

- create from dashboard;
- verify persistence;
- fresh session refetch.

### Duplicate inquiry

- send same identity twice;
- verify one lead;
- verify two source interactions/activity records if intended.

### Cross-workspace

- seed matching identities in two workspaces;
- verify no cross-tenant deduplication or visibility.

### Anonymous

- verify only explicitly public intake paths can create intended records;
- anonymous user cannot read dashboard leads.

### Failure

- simulate database failure;
- ensure caller receives controlled error;
- no phantom success.

---

# 9. Leads List / Lead Detail Repair and Completion

Audit the known `/dashboard/leads` discrepancy first.

The Leads module is complete only if all of the following work:

```text
ingest
→ list
→ open detail
→ update
→ pipeline
→ tasks
→ activity
→ meetings
→ emails
→ proposals
```

Lead detail should become the customer/opportunity 360 page.

Recommended sections:

- summary;
- contact/company;
- intake/business description;
- requested solution;
- pipeline stage/history;
- tasks;
- meetings;
- transcripts;
- email communication;
- activity;
- proposals;
- AI recommendations.

Do not force all sections into one giant component. Keep bounded domain components.

---

# 10. Pipeline

## 10.1 Functional Pipeline

Audit the existing 11-stage pipeline.

Do not redesign stage names merely for preference if current stages are viable.

Verify:

- stages persist;
- dragging/moving persists server-side;
- refresh retains stage;
- stage order is deterministic;
- RLS isolates workspace;
- invalid transitions fail safely.

## 10.2 Stage History

Every meaningful transition must be auditable.

Track:

- from stage;
- to stage;
- actor;
- source (`human`, `system`, `ai_recommendation_accepted`, etc.);
- reason if available;
- timestamp.

## 10.3 Deterministic vs AI Stage Changes

Use deterministic rules where business semantics are explicit.

Examples:

- successful appointment booking may deterministically create an appointment and optionally move to `Discovery Scheduled` if product rules explicitly require it;
- AI interpretation of a transcript should create a recommendation, not silently move the lead.

---

# 11. Calendar Integration

The customer-facing booking calendar must reflect a real host's availability.

## 11.1 Initial Provider

Prefer Google Calendar first unless repository/provider requirements dictate otherwise.

Architecture must not prevent later Outlook/Microsoft Graph support.

## 11.2 Calendar Connection

A workspace user should be able to connect an authorized calendar.

Requirements:

- OAuth authorization code flow or existing secure provider flow;
- server-side token handling;
- encrypted refresh credentials;
- minimum scopes;
- connection status;
- disconnect/revoke behavior;
- expired/revoked token handling;
- no tokens in client bundles/logs.

Google Sign-In is out of scope. Calendar OAuth is an integration authorization and should remain architecturally separate from application-login OAuth.

## 11.3 Availability

Compute availability from:

```text
configured working hours
MINUS provider busy periods
MINUS existing CodeOutfitters bookings
MINUS buffers
MINUS minimum-notice window
=
bookable slots
```

Support:

- timezone;
- meeting duration;
- working hours;
- buffer before;
- buffer after;
- minimum notice;
- maximum future booking horizon.

Do not invent availability when provider free/busy retrieval fails.

Fail closed with a useful message.

## 11.4 Host

Model an explicit booking host from the beginning.

Do not hardcode one person's email throughout the booking logic.

Concept:

```text
booking_host_user_id
```

Initial deployment may use one host.

## 11.5 Event Creation

Successful booking should:

1. persist appointment;
2. create external calendar event when enabled;
3. generate/use provider meeting link if configured;
4. link appointment to lead;
5. emit activity;
6. trigger confirmation email;
7. schedule reminders.

Define transaction/failure semantics carefully because external calendar creation and DB persistence cannot be one database transaction.

Use an explicit status/reconciliation pattern rather than lying about success.

## 11.6 Meeting Link

Do not build custom video calling.

Prefer:

- Google Meet through Calendar;
- Zoom integration if already available/approved.

Persist external meeting URL safely.

## 11.7 Sync

Architecture must allow:

- provider event updated;
- provider event cancelled;
- event moved;
- webhook retries;
- reconciliation.

If webhook synchronization is not part of first implementation, document the limitation and ensure it does not silently produce stale data forever.

## 11.8 Calendar Tests

Test:

- valid connection abstraction;
- free/busy subtraction;
- timezone boundaries;
- daylight-saving transitions where relevant;
- buffer behavior;
- minimum notice;
- concurrent booking attempt;
- provider failure;
- token expiry;
- cross-workspace isolation;
- duplicate provider webhook;
- booking persistence;
- lead linkage;
- meeting-link persistence.

---

# 12. Email Integration

Email must be integrated into the CRM, not turned into a Gmail clone.

## 12.1 Two Email Concerns

### Transactional email

Continue/reuse the project's existing transactional provider (historically Resend) for system email such as:

- booking confirmation;
- inquiry confirmation;
- proposal delivery where appropriate;
- reminder email.

### Connected business mailbox

Use a provider integration (initially Gmail where practical) for:

- inbound messages;
- reply/thread synchronization;
- sending as the connected salesperson when needed;
- lead communication history.

Do not replace a working transactional provider merely because Gmail is connected.

## 12.2 Gmail Connection

Requirements:

- secure OAuth connection;
- minimum scopes;
- incremental authorization if practical;
- safe token storage;
- disconnect/revoke;
- sync-state tracking;
- provider error mapping.

Do not request broad mailbox permissions unless the feature genuinely requires them.

## 12.3 Email Threads

Store enough normalized metadata to support CRM context:

```text
thread
message
provider_thread_id
provider_message_id
sender
recipients
subject
sent_at
direction
lead_id
```

Do not unnecessarily persist full provider objects.

## 12.4 Inbound Matching

Preferred deterministic matching:

1. provider thread already linked → same lead;
2. sender/recipient normalized email uniquely matches lead → attach;
3. ambiguous identity → do not silently attach;
4. unknown sender may create a lead candidate or lead depending on approved product behavior.

Default safe behavior for ambiguous inbound email:

- surface for review;
- do not merge records automatically.

## 12.5 Inbound Email as Lead Source

Where approved, an unknown inbound business email can create a new lead or pending lead candidate.

Record:

- source = inbound_email;
- provider message/thread ID;
- first-contact timestamp.

Ensure spam/noise cannot trivially flood production CRM without controls.

If automatic creation is too risky without explicit business rules, implement a review queue rather than uncontrolled ingestion.

## 12.6 Outbound Email

From lead/proposal context, allow authorized user to:

- draft;
- edit;
- send;
- record delivery attempt;
- persist message metadata;
- emit activity.

AI-generated drafts require human send confirmation initially.

## 12.7 Email AI

AI workflows may:

- summarize thread;
- extract commitments;
- extract unanswered questions;
- detect objections;
- detect budget signals;
- detect timeline;
- recommend follow-up;
- draft reply.

Important outputs should include evidence references to source message IDs/timestamps where feasible.

## 12.8 Email Tests

Test:

- thread normalization;
- deterministic matching;
- ambiguous matching;
- unknown sender behavior;
- duplicate webhook/message;
- outbound send success;
- outbound send failure;
- proposal is not marked sent when email fails;
- token expiry;
- disconnect;
- cross-workspace isolation;
- RLS;
- AI analysis is scoped to permitted messages only.

---

# 13. Public Intake Repositioning

Remove the narrow automation-marketplace framing.

The intake should gather business context useful to sales and AI.

Suggested questions:

- What does your business do?
- What problem are you trying to solve?
- What would you like to build?
- How do you handle this today?
- What tools/systems do you already use?
- What would success look like?
- optional timeline;
- optional budget range if business chooses to ask.

Do not make the intake unnecessarily long.

Persist structured answers linked to the lead/source.

AI may analyze intake after submission, but the initial form should remain deterministic and reliable.

---

# 14. Meetings and Transcript Ingestion

## 14.1 Transcript Input

Support a practical first path.

At minimum implement one reliable transcript ingestion path, such as:

- paste;
- text/file upload;
- existing provider import.

If a live Zoom/Meet/Tactiq integration is unavailable, do not block all AI work on it.

Design a provider-neutral ingestion boundary.

## 14.2 Preserve Raw Source

Store:

- raw transcript/source;
- source metadata;
- meeting relation;
- ingestion timestamp.

AI analysis must be a separate record/version.

## 14.3 Transcript Analysis

Extract structured data:

```json
{
  "summary": "",
  "businessContext": [],
  "requirements": [],
  "painPoints": [],
  "businessGoals": [],
  "constraints": [],
  "budgetSignals": [],
  "timelineSignals": [],
  "decisionMakers": [],
  "objections": [],
  "competitorsOrExistingTools": [],
  "nextActions": [],
  "questionsStillOpen": [],
  "recommendedPipelineStage": null,
  "proposalReady": false,
  "confidence": {}
}
```

Exact schema may differ, but must be validated and typed.

For important claims distinguish:

- fact;
- inference;
- recommendation.

Where feasible include source evidence:

- transcript segment/time;
- message ID;
- quote offset/reference.

Avoid long copyrighted transcript duplication in generated customer artifacts; store source internally as needed.

---

# 15. Central AI Architecture

Do not scatter vendor calls across React components/routes.

## 15.1 Provider Abstraction

Create a bounded abstraction:

```text
AIProvider
  generateStructured(...)
  generateText(...)
```

Initial provider may be OpenAI, Anthropic, or existing project provider.

Do not rewrite existing AI Copilot infrastructure if it can be reused safely.

## 15.2 Workflow Layer

Implement named workflows such as:

```text
lead_intake_analysis
email_thread_analysis
meeting_transcript_analysis
opportunity_summary
next_action_recommendation
pipeline_stage_recommendation
proposal_requirements
proposal_architecture
proposal_generation
market_price_estimation
internal_quote_recommendation
follow_up_draft
```

Each workflow declares:

- context requirements;
- model/provider;
- prompt version;
- response schema;
- retry behavior;
- persistence behavior.

## 15.3 Opportunity Context

Create one canonical server-side context assembly layer.

Concept:

```text
OpportunityContext:
  lead
  company/business
  intake
  pipeline
  tasks
  activity
  appointments
  meetings
  transcripts
  emails
  proposals
```

Do not let every route independently query random customer data for AI.

The context builder must use authenticated workspace-scoped access.

## 15.4 Structured Output

All consequential AI extraction/recommendation outputs must be schema validated.

Pattern:

```text
model response
→ parse
→ schema validate
→ accepted?
   yes → persist
   no → bounded repair/retry
   still invalid → controlled failure
```

Never trust raw model JSON.

## 15.5 Async Jobs

Heavy workflows such as transcript analysis and proposal generation should support asynchronous execution.

States:

- queued;
- running;
- completed;
- failed;
- retrying/cancelled where needed.

Do not block UI indefinitely on long transcript analysis.

If the project has an existing queue/job mechanism, reuse it.

If no production queue exists, choose the smallest robust mechanism supported by the hosting architecture and document tradeoffs.

## 15.6 AI Auditability

Record enough to debug:

- workflow;
- model;
- prompt version;
- status;
- timestamps;
- token usage if available;
- cost estimate if available;
- error class;
- source entity IDs.

Do not log secrets.

## 15.7 Prompt Versioning

Keep prompts outside React components.

Version significant prompts:

```text
lead-intake-v1
transcript-analysis-v1
email-analysis-v1
proposal-generation-v1
pricing-v1
```

Do not rewrite historical output silently when prompt changes.

---

# 16. AI Recommendations

AI should operate as an intelligence layer, not merely a chat window.

Create recommendation UI/data sufficient to present:

```text
Recommended action
Confidence
Reason
Evidence
[Accept] [Dismiss]
```

Examples:

- move lead to Proposal Draft;
- create follow-up task;
- ask customer a missing question;
- generate proposal;
- flag budget uncertainty.

Track recommendation resolution.

A human acceptance may trigger deterministic mutation.

---

# 17. AI Copilot Integration

If existing AI Copilot is live, extend it only after core structured workflows exist.

Useful questions:

- What did this lead ask for?
- What changed since the last meeting?
- What questions remain unanswered?
- Why is this opportunity at risk?
- Draft a follow-up.
- What should we do next?
- Generate a proposal draft.
- What pricing assumptions are uncertain?

Copilot must query the same trusted Opportunity Context, not a separate uncontrolled data path.

---

# 18. Proposal System

## 18.1 Proposal Relationship

Every proposal must belong to the correct workspace and opportunity/lead.

## 18.2 Versioning

Never destructively overwrite a sent proposal version.

Possible model:

```text
Proposal
  ├─ Version 1
  ├─ Version 2
  └─ Version 3
```

Historical sent content should remain auditable.

## 18.3 AI Proposal Generation Pipeline

Do not rely on one monolithic prompt.

Preferred stages:

### Extract

- requirements;
- goals;
- constraints;
- risks;
- unknowns.

### Architect

- recommended solution;
- modules;
- integrations;
- implementation phases.

### Scope

- included;
- excluded;
- assumptions;
- dependencies.

### Estimate

- complexity;
- timeline;
- market range;
- pricing drivers;
- missing pricing information.

### Write

- customer-facing proposal sections.

## 18.4 Proposal Context

Use:

- intake;
- lead facts;
- meetings;
- transcripts;
- relevant email threads;
- approved requirements;
- previous proposal versions.

Do not allow unrelated workspace/customer data.

## 18.5 Human Review

Suggested states:

```text
draft
ai_generated
under_review
approved
sent
viewed
accepted
declined
expired
```

Adjust to existing schema.

Human must be able to:

- edit;
- preview;
- approve;
- send.

## 18.6 Structured Editor

Prefer structured sections over a full Google-Docs clone.

Possible sections:

- Executive Summary
- Understanding of Your Business
- Challenges
- Recommended Solution
- Features
- Integrations
- Implementation Plan
- Timeline
- Investment
- Assumptions
- Next Steps

## 18.7 Canonical Representation

Use one canonical proposal content model.

Render:

```text
Proposal content model
  ├─ Web preview
  └─ PDF
```

Avoid independently maintained web/PDF content.

## 18.8 Public Client Access

If existing proposal access tables/RPCs are used:

- audit all token/RLS/security behavior;
- high-entropy token;
- expiration/revocation;
- no IDOR;
- no token leakage into logs/referrers where avoidable;
- no service-role broad access;
- client only sees published proposal version.

Do not expand into customer accounts unless separately approved.

---

# 19. Market Pricing Intelligence

Pricing must be an internal decision-support tool.

## 19.1 Market Estimate

Model should consider:

- project complexity;
- feature count;
- integrations;
- AI work;
- auth;
- dashboards;
- data migration;
- external APIs;
- custom design;
- security requirements;
- timeline urgency;
- mobile requirements;
- support/maintenance.

Return structured output:

```json
{
  "marketRange": {
    "low": 0,
    "likely": 0,
    "high": 0
  },
  "confidence": 0,
  "complexity": "",
  "drivers": [],
  "assumptions": [],
  "missingInformation": []
}
```

## 19.2 Internal Recommended Quote

Do not conflate market estimate with what CodeOutfitters should charge.

Recommended quote may combine:

- market range;
- estimated internal effort;
- internal cost;
- target margin;
- uncertainty;
- risk;
- urgency;
- strategic value;
- ongoing maintenance.

Eventually configurable pricing policy may include:

- minimum project value;
- target margin;
- complexity multiplier;
- AI/integration premium;
- rush premium;
- risk buffer.

If no approved internal pricing policy exists, the system must label recommendation as AI-assisted estimate rather than pretending a deterministic company policy exists.

## 19.3 Confidentiality

Never expose to customer:

- minimum acceptable price;
- internal cost;
- target margin;
- internal pricing notes;
- AI confidence/reasoning intended for staff.

Only approved final price belongs in public proposal.

---

# 20. Email + Proposal Workflow

Approved proposal:

```text
approve
→ publish/render
→ send email
→ provider succeeds
→ persist message
→ proposal status = sent
→ activity event
→ follow-up task/reminder
```

If sending fails:

- proposal stays approved/draft-send-failed as appropriate;
- not falsely `sent`;
- user sees controlled retry action.

Inbound reply should:

- link to correct thread/lead;
- create activity;
- optionally trigger AI analysis;
- identify acceptance/objection signals as recommendations.

---

# 21. Calendar + Meeting + AI Workflow

A target flow:

```text
lead books
→ appointment
→ calendar event
→ meeting link
→ confirmation
→ reminder
→ meeting occurs
→ transcript ingested
→ analysis job
→ requirements
→ next actions
→ pipeline recommendation
→ proposal readiness
```

Do not require AI for deterministic calendar state.

---

# 22. Tasks / Activity / Search Integration

New modules must integrate with existing live primitives.

## 22.1 Tasks

AI/system may suggest tasks.

Creating a task must use existing live Task provider/RLS path.

## 22.2 Activity

Emit meaningful events for successful mutations such as:

- lead_ingested;
- lead_updated;
- stage_changed;
- appointment_booked;
- appointment_cancelled;
- email_received;
- email_sent;
- transcript_added;
- ai_analysis_completed;
- proposal_created;
- proposal_approved;
- proposal_sent.

Do not emit duplicate events.

Activity failure should follow existing project semantics: do not roll back an already-successful primary mutation unless transaction semantics specifically require it, but log/report the secondary failure safely.

## 22.3 Search

When Search is merged/live, consider indexing/searching new live entities only when they have real destinations and safe result shapes.

Do not surface demo-only proposal/meeting records through live Search.

---

# 23. SMS / Twilio

Twilio is lower priority than correct email/calendar.

If implemented:

- require consent/opt-in;
- store consent timestamp/source;
- support opt-out;
- distinguish transactional reminders from marketing;
- never send because a phone number merely exists;
- log message status safely;
- handle provider failure;
- avoid duplicate sends.

Initial SMS use cases:

- appointment reminder;
- appointment change/cancellation;
- proposal-ready notification if explicitly appropriate.

Do not autonomously send sales follow-ups until business policy is approved.

---

# 24. Idempotency / Webhooks

Provider webhooks may be duplicated, reordered, or retried.

Every provider event pipeline must:

1. authenticate/verify provider callback where supported;
2. normalize event;
3. identify provider event/message ID;
4. reject/ignore duplicate processing safely;
5. process through domain service;
6. log controlled status.

Never directly trust webhook workspace/user identifiers without resolving them through stored integration connection.

Use unique constraints where feasible.

---

# 25. Concurrency

Test and handle:

- two users moving same lead;
- duplicate inquiry requests;
- two customers trying to book same last slot;
- email webhook arriving twice;
- calendar update arriving during local edit;
- two proposal generation requests;
- stale browser update after another user changed stage.

Use optimistic concurrency/versioning or transactional conditions where justified.

At minimum avoid silent lost updates in critical flows.

---

# 26. RLS / Authorization Matrix

For every new/modified table, document:

- SELECT;
- INSERT;
- UPDATE;
- DELETE;
- public/anon access;
- authenticated access;
- workspace ownership;
- special public proposal-token behavior.

Tests must prove:

- member of workspace A can access permitted workspace A rows;
- unrelated workspace B cannot read or mutate;
- anonymous user cannot access dashboard data;
- public intake can only perform intended limited action;
- proposal token cannot enumerate another proposal;
- integration tokens are never queryable from ordinary client paths.

Do not rely solely on application filters. RLS remains authoritative.

---

# 27. Error Taxonomy

Do not return raw Postgres/Supabase/provider/AI errors to clients.

Use typed errors such as:

- Unauthorized
- Forbidden
- ValidationError
- NotFound
- Conflict
- ProviderUnavailable
- IntegrationDisconnected
- RateLimited
- AIWorkflowFailed
- ExternalSendFailed

Logs may contain safe diagnostic IDs, not secrets.

User-facing errors should support recovery.

---

# 28. Observability

Add useful logs/metrics without logging sensitive content.

Track:

- lead ingestion successes/failures by source;
- duplicate resolution;
- booking provider failures;
- email sync failures;
- AI job latency/failure;
- proposal generation failure;
- outbound send failure;
- webhook deduplication;
- OAuth connection health.

Prefer correlation/request IDs.

---

# 29. Migration Discipline

Before creating migration:

1. inspect current schema;
2. prove required field/table/index is absent;
3. define exact requirement;
4. create minimal migration;
5. add RLS;
6. add grants;
7. add indexes;
8. test `supabase db reset --local`;
9. run integration tests against fresh local DB;
10. run advisor locally where available.

Do not modify hosted production database until code/PR review and explicit deployment step.

---

# 30. External Credentials / Provider Stop Conditions

The agent must never invent or scrape credentials.

If Gmail/Calendar/Twilio/AI provider configuration is missing:

- implement safe provider adapter/config validation;
- create local deterministic fake/test provider;
- test domain behavior;
- document exact environment variables/scopes/provider-console steps;
- mark production integration activation as `EXTERNAL_CONFIGURATION_REQUIRED`;
- continue implementing other unblocked requirements.

Do not claim an integration is production-verified without actual provider evidence.

The absence of credentials should not be used as an excuse to leave internal architecture/tests incomplete.

---

# 31. Testing Strategy

Use multiple layers.

## 31.1 Unit

Test pure:

- normalization;
- deduplication scoring/rules;
- availability math;
- email matching;
- AI schema parsers;
- pricing-rule math;
- result normalization;
- state transitions.

## 31.2 Provider / Service

Test:

- authenticated server providers;
- typed error mapping;
- domain service behavior;
- no demo fallback.

## 31.3 Local Supabase Integration

Use disposable users/workspaces.

Prove:

- persistence;
- fresh-session refetch;
- RLS;
- cross-workspace isolation;
- triggers;
- constraints;
- migrations.

## 31.4 API

Test:

- auth;
- validation;
- malformed input;
- successful result;
- empty result;
- provider failure;
- rate/size limits where relevant.

## 31.5 UI

Test:

- loading;
- success;
- empty;
- error;
- retry;
- keyboard accessibility where relevant;
- stale async result protection.

## 31.6 Browser / End-to-End

When browser automation is available, execute true user flows.

Do not claim click verification without doing it.

---

# 32. Mandatory End-to-End Journeys

## 32.1 Journey A — Inquiry to Lead

1. Submit public inquiry.
2. Verify HTTP success.
3. Verify lead persisted.
4. Verify source metadata.
5. Verify correct workspace.
6. Verify initial pipeline stage.
7. Open dashboard.
8. Verify lead appears.
9. Open detail.
10. Refresh/fresh session.
11. Verify persistence.
12. Verify activity.

## 32.2 Journey B — Duplicate Inquiry

1. Submit inquiry for existing email.
2. Verify no duplicate lead.
3. Verify new interaction/source event.
4. Verify context updated appropriately.

## 32.3 Journey C — Booking

1. Use availability endpoint.
2. Provider busy period blocks a slot.
3. Choose valid slot.
4. Existing lead matched or new lead created.
5. Appointment persisted.
6. External event adapter invoked.
7. Meeting link persisted if provider returns one.
8. Confirmation email path invoked.
9. Activity created.

## 32.4 Journey D — Email

1. Ingest test inbound provider message.
2. Match to lead deterministically.
3. Persist normalized thread/message.
4. Activity created.
5. AI analysis job can run.
6. Suggested follow-up appears.
7. Human drafts/sends reply through fake/local provider.
8. Success recorded.
9. Failure path does not claim sent.

## 32.5 Journey E — Transcript Intelligence

1. Attach transcript to meeting.
2. Persist raw transcript.
3. Start AI analysis.
4. Return validated structured requirements.
5. Save evidence/confidence.
6. Create recommendation, not silent consequential mutation.
7. Accept recommendation.
8. Verify resulting task/stage mutation and activity.

## 32.6 Journey F — Proposal

1. Open lead.
2. Generate proposal from current context.
3. Verify structured requirements.
4. Verify market estimate.
5. Verify internal quote recommendation.
6. Human edits.
7. Approve.
8. Render web preview.
9. Generate PDF.
10. Send using email adapter.
11. Mark sent only after successful provider call.
12. Verify activity.
13. Verify historical version remains immutable.

---

# 33. Failure Acceptance Tests

Mandatory cases:

- Supabase write fails during lead ingestion;
- calendar free/busy provider unavailable;
- calendar token revoked;
- selected slot becomes unavailable concurrently;
- email provider send fails;
- duplicate email webhook;
- duplicate calendar webhook;
- AI provider timeout;
- AI invalid structured JSON;
- AI rate limit;
- proposal rendering failure;
- PDF failure;
- public proposal token invalid/expired;
- unauthorized workspace request;
- stale client mutation conflict.

Primary data must not be corrupted merely because a secondary AI/activity process fails.

---

# 34. Performance Rules

Avoid premature optimization, but enforce basics:

- bounded list/search queries;
- pagination for large email/activity/transcript collections;
- no client-side full-table filtering;
- no N+1 relationship fetch loops;
- index frequent workspace/time/status/provider-ID lookups;
- long AI jobs asynchronous;
- cache only where authorization boundaries remain safe.

If an index is needed, add it with migration and explain the query it supports.

---

# 35. Privacy

Email, transcripts, and proposals may contain sensitive customer information.

Requirements:

- minimum data collection;
- tenant isolation;
- no secrets in AI prompts beyond necessary context;
- no production customer data in test fixtures;
- safe deletion/retention hooks where practical;
- no sensitive provider payloads in general logs;
- disconnecting integration stops future access.

Do not claim compliance certifications not actually established.

---

# 36. Accessibility / UX

Preserve existing design language.

Do not redesign the whole dashboard.

For new surfaces:

- keyboard accessible controls;
- visible focus states;
- labels for form controls;
- loading/empty/error states;
- destructive confirmation where appropriate;
- no misleading success state;
- responsive behavior consistent with current dashboard.

---

# 37. Implementation Order

Execute in dependency order, not requirement-number order.

## Phase 0 — Audit and repair foundation

- strict repository audit;
- resolve current main/PR state;
- verify auth/RLS;
- repair Leads list if genuinely broken;
- verify lead detail;
- verify pipeline persistence;
- verify existing Tasks/Activity/Search integration.

## Phase 1 — Lead ingestion

- canonical ingestion service;
- inquiry;
- booking;
- manual create;
- deduplication;
- source attribution;
- integration tests.

## Phase 2 — Integration foundation

- integration connection abstraction;
- secure provider token design;
- provider interfaces;
- local/test providers.

## Phase 3 — Calendar

- host;
- availability rules;
- free/busy;
- appointment creation;
- external event;
- meeting link;
- reminders;
- sync/reconciliation behavior.

## Phase 4 — Email

- Gmail/business mailbox adapter;
- inbound normalization;
- thread/lead matching;
- outbound send;
- activity;
- proposal/follow-up mail.

## Phase 5 — AI foundation

- provider abstraction;
- structured output;
- prompt versioning;
- workflow runner;
- async jobs;
- auditability;
- Opportunity Context.

## Phase 6 — AI CRM intelligence

- intake analysis;
- email analysis;
- transcript analysis;
- requirement extraction;
- opportunity summary;
- pipeline recommendation;
- next-action recommendation.

## Phase 7 — Proposals

- lead relationship;
- versions;
- generation pipeline;
- editor;
- review;
- web preview;
- PDF;
- secure publish/access;
- send.

## Phase 8 — Pricing

- market estimate;
- internal recommendation;
- configurable policy if approved;
- confidentiality enforcement.

## Phase 9 — SMS

- consent;
- Twilio adapter;
- appointment reminders;
- failure/idempotency.

---

# 38. Incremental Commit Discipline

Do not produce one enormous unreviewable commit.

Prefer coherent commits/PR checkpoints by phase.

Examples:

- `fix: complete live leads list`
- `feat: unify lead ingestion`
- `feat: connect calendar availability`
- `feat: integrate crm email threads`
- `feat: add structured ai workflows`
- `feat: generate proposals from opportunity context`
- `feat: add internal pricing intelligence`

At each checkpoint:

- review diff;
- run targeted tests;
- run TypeScript;
- run touched lint;
- run build when meaningful.

Do not merge automatically unless explicitly authorized.

---

# 39. Quality Gates

Before calling the entire goal complete, run at minimum:

```text
npx tsc --noEmit
eslint on all touched files
full Vitest suite
npx next build
supabase db reset --local
relevant local Supabase/RLS integration tests
```

Also run provider-specific integration tests that do not require production data.

If the repository defines canonical scripts, prefer them.

Report exact:

- commands;
- exit codes;
- test file count;
- test count;
- failures;
- skips;
- warnings;
- build status.

Do not hide pre-existing failures. Distinguish:

- pre-existing;
- introduced;
- fixed.

---

# 40. Strict Completion Matrix

Maintain a progress matrix in this file or an adjacent generated status file.

For every requirement mark:

- NOT_STARTED
- AUDITED
- IMPLEMENTING
- CODE_COMPLETE
- TESTED_LOCAL
- EXTERNAL_CONFIGURATION_REQUIRED
- VERIFIED_END_TO_END
- BLOCKED

Never mark VERIFIED_END_TO_END without actual end-to-end evidence.

Required rows:

1. Lead ingestion
2. CRM pipeline
3. Lead context
4. Transcript → CRM
5. AI pipeline recommendations
6. Real calendar availability
7. Calendar integration
8. Meeting links
9. Meeting reminders
10. SMS/Twilio
11. Email integration
12. Intake wording
13. Business/problem intake
14. Custom-software positioning
15. Proposal ↔ lead
16. Transcript/context → proposal
17. Requirements extraction
18. Proposal review/send
19. Proposal web/PDF
20. Market pricing
21. Internal quote recommendation

---

# 41. Definition of Done

The master goal is done only when all non-external requirements are:

- implemented;
- tested;
- type-safe;
- lint-clean in touched files;
- build-clean;
- RLS-tested;
- live/demo separated;
- documented.

Any provider requirement needing credentials must be either:

### VERIFIED_END_TO_END

Actual provider integration works in a safe environment.

or:

### EXTERNAL_CONFIGURATION_REQUIRED

All code, migrations, adapters, tests, configuration validation, provider setup instructions, and safe failure behavior are complete, and the only remaining work is an external credential/provider-console action that the agent cannot legitimately perform.

The master goal is **not** done if a requirement remains:

- stubbed;
- demo-only in live mode;
- provider_required without justified external blocker;
- untested;
- cross-workspace vulnerable;
- dependent on fake production claims.

---

# 42. Final Security Audit

Before final verdict, re-audit:

- service-role usages;
- all new public routes;
- RLS policies;
- OAuth token storage;
- webhook verification;
- public proposal tokens;
- AI data access;
- email scoping;
- calendar scoping;
- cross-workspace IDOR;
- client-controlled workspace/user IDs;
- raw provider/Postgres error leakage;
- secrets in logs;
- demo imports in live paths.

Run Supabase advisors where available.

Do not expand unrelated advisor cleanup unless a finding is caused by this implementation or is a direct security blocker.

---

# 43. Final Product Audit

Prove the product behaves like one connected system.

A successful final scenario should look like:

```text
Customer submits business inquiry
→ lead is persisted
→ lead appears in dashboard
→ source/context correct
→ AI summarizes intake
→ salesperson sees next action
→ customer books using real availability
→ calendar event/meeting link exists
→ confirmation/follow-up email works
→ meeting transcript is attached
→ AI extracts requirements
→ AI recommends stage/task
→ human accepts recommendation
→ proposal generated
→ market range generated
→ internal quote generated
→ human reviews
→ professional proposal renders
→ proposal sends successfully
→ activity timeline contains meaningful history
→ fresh session shows the same persistent state
```

Use local/synthetic data unless explicit safe staging data is authorized.

---

# 44. Required Final Report

Return a final report with exactly these sections.

## A. Repository Baseline

- main SHA;
- branch;
- initial dirty state;
- preserved unrelated files.

## B. Audit Findings

For every target domain:

- prior state;
- issue;
- final state.

## C. Database

- migrations;
- tables;
- indexes;
- RLS;
- advisor results.

## D. Lead Ingestion

- sources;
- deduplication;
- persistence;
- fresh session;
- cross-workspace;
- end-to-end evidence.

## E. CRM / Pipeline

- lead list/detail;
- stages;
- persistence;
- history;
- activity.

## F. Email

- provider architecture;
- inbound;
- outbound;
- thread matching;
- AI;
- security;
- external configuration status.

## G. Calendar

- provider;
- availability;
- host;
- booking;
- event/meeting link;
- reminders;
- sync;
- external configuration status.

## H. AI

- provider abstraction;
- structured workflows;
- Opportunity Context;
- jobs;
- evidence/confidence;
- audit/cost;
- failure handling.

## I. Proposals

- lead linkage;
- versions;
- generation;
- editor/review;
- web;
- PDF;
- access security;
- sending.

## J. Pricing

- market estimate;
- internal quote;
- confidentiality;
- missing policy limitations.

## K. SMS

- implemented/deferred;
- consent;
- provider status.

## L. Security

- RLS;
- service role;
- tenant isolation;
- OAuth tokens;
- webhooks;
- proposal tokens;
- demo separation.

## M. Testing

- unit;
- integration;
- local Supabase;
- RLS;
- UI;
- browser;
- full suite;
- build.

## N. Requirement Matrix

List all 21 requirements with final state.

## O. External Blockers

List only blockers that truly require user/provider action.

For each:

- exact provider;
- exact setting/credential;
- exact reason;
- what code is already complete;
- how to verify after configuration.

## P. Git / PR State

- commits;
- branch;
- PRs;
- merge status;
- no unrelated files.

## Q. Final Verdict

Answer:

1. Does real lead ingestion work?
2. Do inquiry/booking/manual/email sources behave correctly?
3. Does deduplication work?
4. Is the CRM pipeline genuinely persistent?
5. Does email integration work or have only an explicit external-config blocker?
6. Does calendar use real availability or have only an explicit external-config blocker?
7. Are meeting links/reminders working?
8. Can transcripts produce structured CRM intelligence?
9. Does AI provide evidence-backed recommendations without silently making consequential decisions?
10. Can CodeOutfitters generate a lead-linked professional proposal?
11. Does AI produce a market range and internal quote safely?
12. Are all live paths free of demo fallback?
13. Is tenant isolation proven?
14. Are all tests/build gates green?
15. Which requirements, if any, are not VERIFIED_END_TO_END and exactly why?

---

# 45. Agent Loop / Execution Rules

While executing this goal:

1. Read this entire file before making changes.
2. Audit current code before implementation.
3. Maintain a short progress ledger.
4. Work in dependency order.
5. After each meaningful implementation slice:
   - run targeted tests;
   - fix failures introduced by the slice;
   - re-read affected goal requirements.
6. Periodically run TypeScript and touched-file lint.
7. Do not stop merely because one test passes.
8. Continue to the next incomplete requirement while work remains.
9. If a blocker requires external credentials:
   - mark it `EXTERNAL_CONFIGURATION_REQUIRED`;
   - implement/test everything possible around it;
   - continue other unblocked requirements.
10. If a blocker is architectural/security-related:
    - do not bypass it;
    - report it precisely;
    - choose the safest minimal design.
11. Never change tests solely to remove a legitimate invariant.
12. Never claim browser/provider/production verification that was not performed.
13. Before declaring completion:
    - run full quality gates;
    - run strict security audit;
    - run requirement matrix audit;
    - re-open this goal file and check every line item.

The objective is not "make the suite green at any cost."

The objective is:

**Implement the requested CodeOutfitters product correctly, securely, maintainably, and prove it.**
