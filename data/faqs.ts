import type { FaqItem } from '@/components/faq'

export const servicesFaqs: FaqItem[] = [
  { q: 'How much does a system like this cost?', a: 'There are no generic packages — every build gets a fixed quote after a discovery call and workflow audit, based on your actual tools and volume. You see the exact cost and timeline before anything is built.' },
  { q: 'Which service should I start with?', a: 'Whichever workflow eats the most hours. On the discovery call we map your biggest time drains and tell you honestly which single system is worth building first — sometimes it’s none of them yet.' },
  { q: 'Will these work with the tools we already use?', a: 'That’s the default. Every system connects to your existing stack — calendar, CRM, invoicing, messaging — rather than forcing a migration to new software.' },
  { q: 'What does "ships in 7 days" actually mean?', a: 'Seven days from approved scope to a tested, live system for a typical single-workflow build. Larger custom builds get their own timeline in the proposal — stated up front, not discovered later.' },
  { q: 'What happens after support ends?', a: 'The system keeps running — it’s yours, documented and handed off. If you want ongoing monitoring or new automations later, we scope that separately when you ask.' },
]

export const industriesFaqs: FaqItem[] = [
  { q: 'What if my industry isn’t listed?', a: 'Most automation we build isn’t industry-specific software — it’s the workflow underneath it (intake, scheduling, follow-up, back office). If you run a business with repetitive manual work, we can very likely help.' },
  { q: 'Do you need industry-specific software experience?', a: 'We learn your existing tools during discovery rather than forcing you onto new software. Most builds connect to what you already use.' },
  { q: 'How is pricing decided per industry?', a: 'There’s no fixed package by industry — every build gets a fixed quote and timeline after a discovery call and workflow audit, based on the actual scope.' },
  { q: 'Can one system serve multiple industries at once (e.g. multi-location)?', a: 'Yes — we regularly build systems that flex across locations or service lines within the same business.' },
]

export const processFaqs: FaqItem[] = [
  { q: 'How long does the whole process take?', a: 'A typical single-workflow build ships about 7 days after the proposal is approved. Larger custom builds get their own timeline, stated up front in the proposal.' },
  { q: 'What do I need to prepare before discovery?', a: 'Nothing formal — just be ready to walk through how work actually happens today. We map your existing tools and process on the call.' },
  { q: 'Can the scope change after the proposal?', a: 'Yes, but it is handled as a change to the fixed proposal, not a surprise invoice — you always see the cost and timeline impact before we proceed.' },
  { q: 'What happens if testing finds an issue?', a: 'We fix it before handoff. Nothing goes live labeled done until it has run against real traffic and held up.' },
]

export const securityFaqs: FaqItem[] = [
  { q: 'Are you SOC 2 or HIPAA certified?', a: 'No formal certifications today — we’re upfront about that. We follow security-conscious practices (least-access setup, server-side secrets, human review for sensitive actions) on every build, and we’ll tell you plainly if a requirement is outside what we currently support.' },
  { q: 'Who has access to our accounts and data?', a: 'Only what the specific automation needs, connected with scoped or dedicated integration accounts wherever the platform supports it — not broad admin access by default.' },
  { q: 'What happens if the AI gets something wrong?', a: 'Sensitive actions (payments, cancellations, ambiguous requests) are routed to a human reviewer by design, not resolved automatically by the model.' },
  { q: 'Can we review the system before it goes live?', a: 'Yes — testing and review happen before launch, and you approve the build before it touches real customers or data.' },
  { q: 'What if we need to pause or roll back an automation?', a: 'Every handoff includes a documented rollback path, so pausing or reverting a system doesn’t require guesswork.' },
]

export const caseStudiesFaqs: FaqItem[] = [
  { q: 'Are these real client results?', a: 'These case studies are illustrative — built from typical engagement patterns and results we see across similar builds, not published client data. On a discovery call we can walk through the specific mechanics behind any of them.' },
  { q: 'Will my results look like these?', a: 'Every business is different, so outcomes depend on your volume and current process. We map the realistic upside for your specific case during discovery, before you commit to anything.' },
  { q: 'How is a case study scoped and measured?', a: 'Each one tracks a small number of concrete metrics — time saved, error rate, response speed — measured before and after the build goes live.' },
  { q: 'Can I see a case study closer to my industry?', a: 'Tell us your industry on the discovery call — most manual-work bottlenecks repeat across industries even when the tools differ.' },
]

export const contactFaqs: FaqItem[] = [
  { q: 'What happens after I submit the form?', a: 'You will hear back within 4 hours on business days to schedule a discovery call — no automated sales sequence, a real reply.' },
  { q: 'Is the discovery call really free?', a: 'Yes — the call and the workflow audit that comes with it are both free, with no obligation to move forward.' },
  { q: 'How fast can a system actually ship?', a: 'A typical single-workflow build ships about 7 days after the proposal is approved. Larger builds get their own timeline in the proposal.' },
  { q: 'Do I need to know exactly what I want automated?', a: 'No — most clients start with "this eats too much of our week." We help identify the highest-ROI system to build first.' },
]
