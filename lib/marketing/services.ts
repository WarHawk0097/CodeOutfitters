/**
 * The single source of truth for the public service hierarchy. Bespoke web
 * application work is first; messaging channels (WhatsApp included) are one
 * integration example inside service 03, never a service of their own.
 *
 * Both the homepage capability section and `/services` render this list, so the
 * order below is the order visitors see on every page.
 */

export type MarketingService = {
  id: string
  num: string
  name: string
  icon: string
  tone: 'green' | 'gold'
  summary: string
  /** What the service covers. Factual scope only — no metrics, no timelines. */
  includes: readonly string[]
  /** How the work usually runs, in order. */
  steps: readonly string[]
}

export const PRIMARY_SERVICES: readonly MarketingService[] = [
  {
    id: 'applications',
    num: '01',
    name: 'Bespoke web applications',
    icon: '/assets/icon-orchestrate.svg',
    tone: 'green',
    summary:
      'Purpose-built web software designed around your organization’s workflows — internal tools, SaaS products and customer-facing applications.',
    includes: ['Internal operations tools', 'SaaS products', 'Customer-facing applications'],
    steps: [
      'Map the workflows the software has to carry, screen by screen',
      'Design the data model, roles and application surfaces',
      'Build, test and hand over a documented application you own',
    ],
  },
  {
    id: 'platforms',
    num: '02',
    name: 'Business platforms and portals',
    icon: '/assets/icon-database-stack.svg',
    tone: 'gold',
    summary:
      'Role-based platforms where staff, clients and partners each see their own view of the same operation — with the permissions that keeps honest.',
    includes: ['Client and partner portals', 'Staff and admin consoles', 'Role-based access and audit trails'],
    steps: [
      'Define every role and what each one may see and do',
      'Build the shared data core once, then the views on top of it',
      'Ship with access control, audit history and onboarding docs',
    ],
  },
  {
    id: 'automation',
    num: '03',
    name: 'Workflow automation and integrations',
    icon: '/assets/icon-automate.svg',
    tone: 'green',
    summary:
      'The connective work behind an application: scheduled jobs, notifications and the third-party systems your operation already depends on.',
    includes: ['Email and SMS notifications', 'CRM and calendar sync', 'Third-party APIs', 'Payments and documents', 'WhatsApp Business messaging'],
    steps: [
      'Document the manual handoffs the team repeats today',
      'Connect the systems of record through their APIs',
      'Automate the handoffs, with retries and a visible audit trail',
    ],
  },
  {
    id: 'modernization',
    num: '04',
    name: 'Product modernization and scale',
    icon: '/assets/icon-scale.svg',
    tone: 'gold',
    summary:
      'Rebuilds and rescues for software that works but no longer holds: slow pages, fragile deploys, features nobody can safely change.',
    includes: ['Rebuilds and re-platforming', 'Performance work', 'Reliability and deployment improvement'],
    steps: [
      'Review the current application, its data and its failure points',
      'Agree what gets kept, replaced and retired — in what order',
      'Ship the change in reversible steps, without a big-bang cutover',
    ],
  },
]

export const SUPPORTING_SERVICE = {
  id: 'strategy',
  name: 'Product strategy, UX and technical architecture',
  summary:
    'Available on its own when the decision comes before the build: what to build, how it should feel to use, and how it should be structured.',
} as const
