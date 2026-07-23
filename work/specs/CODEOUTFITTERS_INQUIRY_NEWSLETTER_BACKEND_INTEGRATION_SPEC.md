# CodeOutfitters — Inquiry, Newsletter, Dashboard and Backend Integration Specification

**Document status:** Implementation authority  
**Project root:** `F:\CodeOutfitters`  
**Public website:** `https://codeoutfitters.vercel.app`  
**Command Center target:** `https://codeoutfitters.vercel.app/dashboard`  
**Purpose:** Consolidate the usable form, popup, file-upload, Shadcn, backend, email, motion, theme and dashboard requirements into one implementation specification.

---

## 1. Required outcome

Implement one connected CodeOutfitters system in which:

1. The public marketing website retains its approved design.
2. The Command Center is available under `/dashboard` on the main domain.
3. The public header includes a **Sign in** action leading to `/dashboard/sign-in`.
4. The Command Center supports a durable **Light / Dark / System** appearance preference.
5. The marketing website contains a balanced inquiry strategy:
   - one full inquiry form on Contact;
   - one compact contextual form on Services;
   - one compact contextual form on Industries;
   - a newsletter-style global inquiry popup;
   - contextual popup triggers on selected pages;
   - no form overload.
6. Every form uses one shared validation and submission engine.
7. Every successful website inquiry is persisted through the backend.
8. Every website inquiry creates or updates a lead visible in the Command Center.
9. Uploaded files are validated, stored safely, associated with the lead, and visible in the lead detail view.
10. Internal and visitor email notifications are sent through the approved email provider.
11. Every enabled dashboard button and form performs its intended action.
12. The final system is tested locally and on the deployed production URLs.

This is not a visual-only task. A control passes only when it performs the correct action and produces the correct durable state change.

---

## 2. Skills that must be used

Claude Code must explicitly load and use the installed skills below before implementation:

### UI/UX skill

Use for:

- form hierarchy;
- information architecture;
- responsive form ergonomics;
- error placement;
- focus order;
- CTA hierarchy;
- popup timing and dismissal behavior;
- balanced inquiry placement;
- mobile Dialog-to-Drawer adaptation;
- accessibility review.

### Taste skill

Use for:

- visual restraint;
- spacing and density;
- typography;
- card and field composition;
- avoiding template-like or generic results;
- preserving the established CodeOutfitters visual identity;
- preventing excessive gradients, shadows, animation or form repetition.

### GSAP skill

Use for:

- popup entrance and exit;
- progressive field/content reveal;
- subtle section transitions;
- CTA micro-interactions;
- scroll-triggered popup eligibility where appropriate;
- `gsap.matchMedia()` responsive behavior;
- `prefers-reduced-motion` support;
- complete animation cleanup on unmount.

Do not create a second competing animation system without checking the existing codebase. Reuse the existing GSAP setup when present. Where the site already uses another motion library, use one clear ownership boundary and avoid animating the same element through two libraries.

### Kowalski Email skill

Use for:

- visitor inquiry-confirmation email;
- internal new-inquiry notification;
- appointment confirmation;
- abandoned-booking reminder copy where authorized;
- concise, credible subject lines;
- plain-text fallbacks;
- responsive HTML email markup;
- sender/reply-to behavior;
- accessible email content;
- deliverability-safe structure.

The skill must not invent discounts, promises, case-study claims, response-time guarantees or services not approved by CodeOutfitters.

### Skill verification

Record:

- exact skill names discovered;
- whether each skill loaded successfully;
- where each skill influenced implementation;
- exact blocker if any named skill is unavailable.

Do not silently skip a requested skill.

---

## 3. Protected design and architecture rules

### Marketing website

Preserve the approved public website design and routes:

- `/`
- `/services`
- `/industries`
- `/process`
- `/case-studies`
- `/about`
- `/security`
- `/contact`

Do not redesign, simplify, modernize or broadly reconstruct approved sections.

### Command Center

Preserve accepted Dashboard and Leads UI except for explicitly authorized additions:

- theme control;
- production backend integration;
- real form-derived data;
- button/functionality repairs;
- sign-in and authenticated routing;
- necessary accessibility fixes.

### One domain, separated applications

Target public paths:

- `https://codeoutfitters.vercel.app/`
- `https://codeoutfitters.vercel.app/dashboard`
- `https://codeoutfitters.vercel.app/dashboard/sign-in`
- `https://codeoutfitters.vercel.app/dashboard/*`

Use a durable path-based architecture, such as a supported Vercel rewrite/multi-zone arrangement, while keeping the marketing site and Command Center independently maintainable.

The browser must retain the main-domain URL. Do not use a visible external redirect to the separate Command Center `.vercel.app` hostname as the final architecture.

---

## 4. Usable material extracted from the supplied component prompts

The supplied component prompts contain useful building blocks, but they must be adapted rather than copied blindly.

### 4.1 Multi-step form — usable parts

Use:

- progress-step pattern;
- Previous / Next navigation;
- per-step validation;
- review step;
- success step;
- controlled form state;
- submission loading state;
- responsive step layout;
- animated step transitions;
- clear inline errors.

Do not use the supplied registration-specific content:

- street address;
- username;
- password;
- confirm password;
- “Create Your Account”;
- “Registration Complete”;
- reload-based “Go to Dashboard”;
- fake `setTimeout` API submission;
- `href="#"` Terms or Privacy links.

Adapt the multi-step pattern into a CodeOutfitters inquiry journey.

### 4.2 Extended file upload — usable parts

Use:

- drag-and-drop;
- keyboard activation;
- accepted-type validation;
- file rejection feedback;
- file previews;
- readable filename, MIME type and size;
- image thumbnails;
- loading/failure states;
- object URL cleanup;
- single or multiple file support;
- `onFilesAccepted` and `onFilesChange`;
- reduced-motion handling.

Do not treat “Ready” as proof of server upload. The final component must separately show:

- selected;
- validating;
- uploading;
- uploaded;
- rejected;
- failed;
- retrying;
- removed.

### 4.3 Shadcn form stack — usable parts

Use official Shadcn-compatible patterns for:

- React Hook Form or the form library already standardized in the repository;
- schema validation;
- `Field`;
- `FieldLabel`;
- `FieldDescription`;
- `FieldError`;
- `FieldGroup`;
- `FieldSet`;
- Input;
- Textarea;
- Select;
- Checkbox;
- Date Picker;
- Button;
- Card;
- Progress;
- Alert;
- Sonner/toast;
- Empty;
- Skeleton;
- Badge.

Prefer the project’s existing installed primitives over adding duplicate versions.

### 4.4 Dialog and Drawer — usable parts

Use:

- Dialog for desktop inquiry popup;
- bottom Drawer for mobile;
- focus trap;
- Escape close;
- outside-click close;
- focus restoration;
- accessible title and description;
- scrollable body;
- visible close control;
- swipe behavior only where reliable;
- iOS-safe viewport handling.

Do not disable pointer dismissal or focus trapping unless a specific workflow requires it.

### 4.5 Newsletter Dialog — usable parts

Use:

- controlled open state;
- title;
- description;
- short form;
- close control;
- responsive card layout;
- animated content reveal;
- manual trigger;
- automatic trigger support.

Do not use:

- generic newsletter copy;
- promotional discounts;
- Unsplash image dependency by default;
- `alert()`;
- `console.log()` as submission;
- email-only submission when the intended outcome is a qualified inquiry;
- duplicate close buttons;
- Framer Motion when GSAP is the chosen motion owner for the popup.

The popup is newsletter-style visually, but its business purpose is a **free workflow-audit inquiry**.

### 4.6 Data table and dashboard primitives — usable parts

Use Shadcn/TanStack patterns for:

- lead search;
- sorting;
- pagination;
- filtering;
- column visibility;
- row selection;
- row actions;
- loading and empty states;
- newly submitted inquiry visibility.

Do not maintain a disconnected marketing-form dataset and a separate dashboard lead dataset.

---

## 5. Shared inquiry engine

Build one reusable inquiry engine, not separate custom form logic for each page.

Suggested modules:

```text
marketing/inquiry/
  inquiry-schema.ts
  inquiry-types.ts
  inquiry-api-client.ts
  inquiry-source-context.ts
  inquiry-form-controller.ts
  inquiry-upload-controller.ts
  inquiry-analytics.ts
  components/
    inquiry-field.tsx
    inquiry-stepper.tsx
    compact-inquiry-form.tsx
    full-inquiry-form.tsx
    inquiry-popup.tsx
    inquiry-mobile-drawer.tsx
    inquiry-success.tsx
    inquiry-file-upload.tsx
```

Use the repository’s actual structure and aliases rather than creating this exact tree blindly.

### Shared capabilities

All variants must share:

- field IDs;
- schema validation;
- normalization;
- duplicate-submission prevention;
- API client;
- error mapping;
- source attribution;
- upload handling;
- submission state;
- analytics events;
- success behavior;
- backend payload;
- tests.

The visual composition may differ by placement.

---

## 6. Inquiry placement strategy

Use a balanced placement model.

| Page | Automatic popup | Manual popup CTA | Inline form | Full form |
|---|---:|---:|---:|---:|
| Home | Yes | Yes | No | No |
| Services | Yes | Yes | One compact form | No |
| Industries | Yes | Yes | One compact form | No |
| Process | Yes | Yes | No | No |
| Case Studies | Yes | Yes, prefilled | No | No |
| About | Yes | Yes | No | No |
| Security | Yes | Yes, contextual | No | No |
| Contact | No | No duplicate | No | Yes |
| Dashboard | No | No | No | No |
| Sign-in | No | No | No | No |

### Services placement

Place one compact form:

- after the service cards;
- before the integrations section.

Fields:

- Name;
- Work email;
- Business name;
- Service of interest;
- Short workflow description;
- Optional file upload.

Behavior:

- service CTA scrolls to or opens the form;
- selected service is prefilled;
- one form only, not one form per service card.

Suggested heading:

> Which workflow is costing you the most time?

### Industries placement

Place one compact form:

- after example workflows by industry;
- before the final CTA.

Fields:

- Name;
- Work email;
- Business name;
- Industry;
- Main workflow problem;
- Optional file upload.

Behavior:

- selected industry is prefilled;
- support “Other industry.”

Suggested heading:

> Tell us where your workflow gets stuck.

### Contact page

Keep the complete inquiry journey here.

Recommended steps:

1. Contact
2. Business
3. Workflow
4. Supporting files
5. Review
6. Submitted / appointment option

Do not request account passwords, usernames or unnecessary residential address data.

---

## 7. Newsletter-style inquiry popup

### Purpose

The popup is a lightweight entry point into the lead pipeline.

Suggested copy:

**Eyebrow:**  
FREE WORKFLOW AUDIT

**Heading:**  
What is eating your team’s time?

**Description:**  
Tell us where the manual work happens. We’ll show you what can be automated and what is not worth automating.

**Initial fields:**

- First name;
- Work email;
- Business name;
- What would you like to automate?

**Primary action:**  
Get my free workflow audit

**Secondary action:**  
Not right now

The popup can optionally reveal one additional qualifying field after engagement, but it must not become a long form.

### Automatic trigger rules

Eligible trigger:

- 25 seconds after meaningful page engagement; or
- 50% scroll depth; or
- desktop exit intent.

Show once when the first eligible condition occurs.

Do not show:

- immediately on page load;
- more than once in seven days after dismissal;
- after successful inquiry submission;
- on Contact;
- under `/dashboard`;
- on sign-in;
- while another modal/drawer is open;
- during a form submission;
- for known authenticated dashboard users.

Manual CTA triggers must remain available even when automatic display is suppressed.

### Storage

Persist only non-sensitive popup state client-side:

- dismissed timestamp;
- submitted flag;
- last automatic-display timestamp;
- popup version.

Do not store entered inquiry details in local storage unless explicitly required and privacy-reviewed.

### Responsive behavior

Desktop:

- Shadcn Dialog.

Mobile:

- Shadcn/Base UI Drawer from the bottom.

Accessibility:

- correct title and description;
- focus trap;
- Escape close;
- focus restoration;
- no background scroll;
- close button;
- validation summary;
- live submission status.

---

## 8. Inquiry data contract

Use one typed request contract.

Suggested payload:

```ts
type InquirySubmissionRequest = {
  submissionId: string
  formVariant:
    | "global_popup"
    | "services_compact"
    | "industries_compact"
    | "contact_full"
    | "case_study_contextual"
    | "security_contextual"
  inquirySource: string
  sourcePage: string
  sourcePath: string
  sourceSection?: string
  selectedService?: string
  selectedIndustry?: string
  selectedCaseStudy?: string
  firstName: string
  lastName?: string
  workEmail: string
  phone?: string
  businessName: string
  jobTitle?: string
  websiteUrl?: string
  companySize?: string
  workflowDescription: string
  desiredOutcome?: string
  timeline?: string
  budgetRange?: string
  consent: {
    privacyAccepted: boolean
    marketingOptIn: boolean
  }
  attachmentTokens?: string[]
  campaign?: {
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
    referrer?: string
  }
  clientContext: {
    locale?: string
    timezone?: string
    viewportClass?: "desktop" | "tablet" | "mobile"
  }
}
```

### Server-owned fields

The client must not authoritatively set:

- database ID;
- pipeline status;
- assigned owner;
- created timestamp;
- risk score;
- lead score;
- IP-derived geography;
- email-delivery status;
- internal notes.

The server creates these.

---

## 9. Backend submission behavior

Implement a real backend boundary.

Suggested endpoint:

```text
POST /api/inquiries
```

or reuse the authoritative existing endpoint when present.

### Required behavior

1. Validate payload server-side.
2. Normalize email and text.
3. Reject unsupported fields.
4. Rate-limit abuse.
5. Apply bot protection/honeypot.
6. Enforce idempotency by `submissionId`.
7. Prevent accidental duplicate records.
8. Create or update the lead.
9. Save the original form submission.
10. Record source page, section, campaign and timestamp.
11. Attach uploaded file records.
12. Create a lead timeline event.
13. Trigger approved emails.
14. Return a typed success response.
15. Return safe field-level validation errors.
16. Never expose secrets or internal database details.

Suggested response:

```ts
type InquirySubmissionResponse = {
  ok: true
  leadId: string
  submissionId: string
  status: "received"
  appointmentNextStep: {
    available: boolean
    url?: string
  }
}
```

### Failure behavior

Support:

- validation failure;
- duplicate/idempotent replay;
- upload failure;
- database failure;
- email queued but delayed;
- rate limit;
- retryable server error.

Do not show success when persistence failed.

---

## 10. Backend data model

At minimum, support:

### Lead

- ID;
- contact details;
- business name;
- service interest;
- industry;
- workflow description;
- source page;
- campaign;
- created date;
- current pipeline status;
- assigned user;
- appointment status;
- last contacted date;
- next follow-up;
- proposal status.

### Lead form submission

- submission ID;
- lead ID;
- form variant;
- raw validated answers;
- source attribution;
- consent;
- created timestamp;
- idempotency key.

### Attachment

- ID;
- lead ID;
- submission ID;
- original filename;
- safe stored filename/key;
- MIME type;
- byte size;
- storage provider key;
- scan status;
- upload status;
- created timestamp.

### Lead timeline event

- lead ID;
- event type;
- human-readable summary;
- actor;
- metadata;
- timestamp.

### Email event

- lead ID;
- submission ID;
- email type;
- provider ID;
- recipient;
- status;
- timestamp.

Use the repository’s existing backend/domain conventions rather than creating duplicate entities.

---

## 11. File upload requirements

Use the supplied extended upload component as a visual and interaction foundation, adapted to the project.

### Allowed files

Initial safe set:

- PDF;
- DOC;
- DOCX;
- XLSX;
- CSV;
- PNG;
- JPG/JPEG.

Server-side acceptance must be authoritative.

### Security

Require:

- size limits;
- file count limits;
- MIME and extension checks;
- sanitized filenames;
- private storage by default;
- signed upload/download access;
- malware scanning when provider support exists;
- no executable content;
- no public directory writes;
- no trusting client-provided MIME type;
- no persistent object URLs;
- delete/retry behavior.

### Dashboard visibility

Lead detail must show:

- attachment name;
- type;
- size;
- upload date;
- scan/status;
- secure open/download action.

Uploaded files must not appear in unrelated leads.

---

## 12. Dashboard ingestion

Every successfully persisted inquiry must appear in the Command Center.

### Dashboard summary

Update from real backend data:

- New leads;
- Leads awaiting first contact;
- Recently submitted inquiries;
- Leads by source;
- Leads by service;
- upcoming appointments;
- overdue follow-ups.

### Leads route

New submissions must support:

- search;
- filtering;
- source;
- service;
- date;
- assigned owner;
- open lead detail;
- view original form answers;
- view attachments;
- view email events;
- update status;
- add internal notes;
- set follow-up;
- view appointment state.

### Cross-route behavior

Where relevant, inquiry creation updates:

- Dashboard Overview;
- Leads;
- Pipeline;
- activity timeline;
- email activity.

Do not require a browser refresh when the dashboard uses real-time or post-mutation cache invalidation. At minimum, a normal refresh must show persisted data.

---

## 13. Every dashboard control must work

Audit every enabled dashboard control across:

- Dashboard;
- Leads;
- Pipeline;
- Appointments;
- Meetings;
- Proposals;
- Follow-ups;
- Email Activity;
- Team;
- Settings.

A control passes only when it:

1. is visible;
2. has the correct role;
3. responds to mouse;
4. responds to keyboard where applicable;
5. performs the intended action;
6. updates the correct durable or demo state;
7. displays success/failure feedback;
8. causes no console/page error;
9. causes no unexpected failed request.

Forbidden:

- empty handlers;
- `href="#"`;
- visual-only buttons;
- toast-only actions where data should change;
- fake form submission;
- fake pagination;
- active-looking disabled elements;
- wrong-record mutation;
- hidden production failure.

---

## 14. Dashboard appearance control

Add:

### Quick header control

- Light;
- Dark;
- System.

Use an accessible menu or segmented control.

### Settings → Appearance

Include:

- Light;
- Dark;
- System;
- Reduced motion preference;
- High contrast when supported.

Optional color themes may be added only when they are token-based, accessible and do not conflict with the approved identity.

### Behavior

- default to System for a new user unless current design authority requires Light;
- persist demo preference locally;
- persist authenticated preference to the backend user profile when auth/backend exists;
- avoid flash of incorrect theme;
- update charts, dialogs, drawers, toasts, forms and menus;
- preserve semantic status colors;
- respect `prefers-color-scheme`;
- respect reduced motion;
- do not apply Command Center themes to the public marketing site.

---

## 15. Public header sign-in

Add a **Sign in** action to the marketing header and mobile menu.

Destination:

```text
/dashboard/sign-in
```

Requirements:

- restrained secondary visual treatment;
- preserve primary CTA hierarchy;
- keyboard accessible;
- no broken route;
- return URL support;
- successful authentication goes to `/dashboard`;
- no automatic inquiry popup on sign-in or dashboard routes.

Do not present demo sign-in as secure production authentication.

---

## 16. Email requirements

Use the approved email provider already configured in the project. When no provider is configured, stop at the exact credential/provider blocker rather than simulating production delivery.

### Visitor inquiry confirmation

Include:

- acknowledgement;
- concise summary of what was submitted;
- clear expected next step;
- appointment link when available;
- reply-to business address;
- no unapproved promise.

### Internal notification

Include:

- contact and business;
- source page;
- service/industry;
- workflow summary;
- attachment count;
- dashboard lead link;
- submission time;
- no sensitive credentials.

### Required logging

Record:

- queued;
- sent;
- delivered when supported;
- bounced;
- failed.

Show relevant events in the lead timeline/email activity.

### Kowalski Email quality bar

Emails must have:

- credible subject line;
- plain-text version;
- mobile-friendly HTML;
- accessible hierarchy;
- consistent brand;
- useful call to action;
- no spam-like claims;
- no fake urgency;
- no excessive imagery.

---

## 17. GSAP motion requirements

Use GSAP intentionally.

### Popup

- subtle opacity/scale/translate entrance;
- reverse exit;
- content stagger;
- no long or bouncy animation;
- no layout shift;
- animation only after Dialog/Drawer is mounted correctly.

### Inline forms

- reveal once near viewport;
- do not animate every field continuously;
- preserve input focus;
- do not transform an actively focused input;
- no scroll-jacking.

### Reduced motion

Under reduced motion:

- remove non-essential transforms;
- use instant or short opacity changes;
- preserve functional state changes;
- no ScrollTrigger scrub.

### Cleanup

- kill timelines and ScrollTriggers on unmount;
- use scoped GSAP contexts;
- prevent duplicate initialization after route changes.

---

## 18. Validation and accessibility

### Validation

Use one server-compatible schema.

Validate:

- required fields;
- email;
- URL when provided;
- phone normalization where provided;
- consent;
- description length;
- select values;
- upload type/count/size.

### Accessibility

Require:

- explicit labels;
- descriptions;
- field errors;
- `aria-invalid`;
- error summary for long forms;
- focus first invalid field;
- semantic fieldsets and legends;
- live submission status;
- keyboard step navigation;
- accessible Dialog/Drawer;
- no keyboard trap;
- touch targets;
- high-contrast focus indicator;
- status not communicated by color only.

---

## 19. Analytics and source attribution

Track meaningful events without sending form contents to analytics.

Suggested events:

- `inquiry_popup_eligible`;
- `inquiry_popup_opened`;
- `inquiry_popup_dismissed`;
- `inquiry_form_started`;
- `inquiry_step_completed`;
- `inquiry_file_selected`;
- `inquiry_submit_attempted`;
- `inquiry_submit_succeeded`;
- `inquiry_submit_failed`;
- `appointment_cta_shown`;
- `appointment_started`.

Do not log:

- email;
- phone;
- free-text workflow content;
- uploaded filenames;
- sensitive form values.

---

## 20. Testing requirements

### Unit/integration

Test:

- schemas;
- source mapping;
- all form variants;
- step navigation;
- validation;
- idempotency;
- duplicate prevention;
- upload validation;
- popup suppression;
- theme persistence;
- email payload creation;
- lead creation;
- timeline creation;
- dashboard queries;
- button behavior.

### Browser tests

Use Microsoft Edge through Playwright.

Test marketing pages at:

- 1440×900;
- 768×1024;
- 375×812.

Test Command Center at the same viewports plus accepted canonical viewports where required.

Verify:

- popup automatic trigger;
- popup dismissal suppression;
- manual popup CTA;
- desktop Dialog;
- mobile Drawer;
- Services form;
- Industries form;
- Contact full form;
- file upload;
- validation;
- successful submission;
- lead appears in dashboard;
- source values are correct;
- attachments belong to the correct lead;
- emails are queued/logged;
- sign-in route;
- theme toggle;
- every enabled dashboard button.

### Browser acceptance

Require:

- zero page errors;
- zero application console errors;
- zero hydration errors;
- zero broken routes;
- zero unexpected failed requests;
- zero active no-op controls;
- no horizontal overflow;
- no inaccessible modal/drawer.

---

## 21. Deployment and domain acceptance

Final production URLs:

```text
https://codeoutfitters.vercel.app/
https://codeoutfitters.vercel.app/contact
https://codeoutfitters.vercel.app/dashboard/sign-in
https://codeoutfitters.vercel.app/dashboard
https://codeoutfitters.vercel.app/dashboard/leads
```

Required:

- marketing routes remain stable;
- `/dashboard/*` deep links work;
- refresh works;
- assets load;
- cookies and auth paths work;
- form API uses the production backend;
- database persistence is verified;
- uploaded file access is secured;
- email provider is verified;
- dashboard theme works;
- public site does not inherit dashboard theme;
- inquiry popup never appears in the dashboard.

---

## 22. Exclusions and corrections from supplied snippets

Do not copy the following into production:

- demo registration copy;
- address/account/password fields for inquiry;
- fake timeout submissions;
- `alert()`;
- `console.log()` as persistence;
- `window.location.reload()` success action;
- `href="#"`;
- Unsplash dependency without approval;
- generic discount newsletter copy;
- plaintext secrets;
- public uploads;
- client-only validation;
- “Ready” upload status before server acceptance;
- duplicate Shadcn primitives;
- unnecessary duplicate animation libraries;
- dashboard-only mock persistence presented as production backend.

---

## 23. Required implementation report

Create:

```text
F:\CodeOutfitters\work\CODEOUTFITTERS-INQUIRY-NEWSLETTER-BACKEND-INTEGRATION-REPORT.md
```

Record:

- skills used;
- architecture;
- form placements;
- components reused;
- API contract;
- database changes;
- upload implementation;
- email provider;
- popup behavior;
- theme implementation;
- dashboard integration;
- controls tested;
- automated tests;
- browser tests;
- deployment;
- live URLs;
- remaining blockers;
- migrations;
- rollback steps.

---

## 24. Final acceptance checklist

The work is complete only when:

- [ ] Shared inquiry engine exists.
- [ ] Global inquiry popup works.
- [ ] Services compact form works.
- [ ] Industries compact form works.
- [ ] Contact full form works.
- [ ] File uploads persist securely.
- [ ] Every submission persists in the backend.
- [ ] Every submission creates or updates a dashboard lead.
- [ ] Source page and campaign are retained.
- [ ] Internal notification email works.
- [ ] Visitor confirmation email works.
- [ ] Email events are logged.
- [ ] New leads appear in Dashboard and Leads.
- [ ] Lead details show form answers and attachments.
- [ ] Public Sign in leads to `/dashboard/sign-in`.
- [ ] Command Center works under `/dashboard`.
- [ ] Light / Dark / System toggle works.
- [ ] Dashboard theme persists correctly.
- [ ] Every enabled dashboard button works.
- [ ] Every form validates and submits.
- [ ] Desktop, tablet and mobile pass.
- [ ] Accessibility passes.
- [ ] Production browser logs are clean.
- [ ] Marketing website remains visually stable.
- [ ] Production deployment is verified.

