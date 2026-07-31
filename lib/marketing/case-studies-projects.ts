/**
 * Project data for `/case-studies` only.
 *
 * Nothing outside that route imports this module: the homepage, the shared
 * layout and every other public page keep the approved production content
 * exactly as deployed.
 *
 * Owner-approved facts only. No metrics, no outcomes, no timelines, no team
 * sizes, no technology stacks and no testimonials: nothing here is inferred
 * from a product name or guessed from a screenshot.
 *
 * Safety rules this file encodes:
 * - `url` is `null` for any application without a public URL that is
 *   appropriate for a public visitor. A null url renders as plain status text,
 *   never as an anchor.
 * - VoiceDesk is linked only at the owner-approved public alias, which serves the
 *   application without authentication and without a share token. No other
 *   VoiceDesk host may be linked, and its imagery is sanitized before publishing:
 *   workspace, caller, lead and booking values are replaced with neutral demo
 *   values in the page before capture, never edited back in afterwards.
 * - Pro Photo Systems publishes on the `www` host; the apex domain does not
 *   resolve, so the apex form must never be linked.
 * - Every image is a local, same-origin WebP under `/images/selected-work/`.
 *   No image is hotlinked, framed or fetched from a project domain.
 * - A `mobile` asset exists only where a genuine phone-width capture exists.
 *   A resized desktop capture, a crop of one, or a branded graphic must never
 *   stand in for a phone view of a product.
 */

/**
 * What an image actually is, so a card can never imply more than the pixels show.
 * - `screenshot`: a capture of a publicly reachable product site.
 * - `branded-fallback`: a CodeOutfitters presentation graphic, not a product view.
 * - `sanitized-screenshot`: a genuine capture of an application whose workspace,
 *   contact and record values were replaced with neutral demo values in the page
 *   before the capture. Layout, navigation and hierarchy are untouched.
 */
export type CaseStudyImageKind = 'screenshot' | 'branded-fallback' | 'sanitized-screenshot'

export type CaseStudyImageAsset = {
  /** Local, same-origin path. Never an absolute or remote URL. */
  src: string
  width: number
  height: number
  kind: CaseStudyImageKind
}

export type CaseStudyVisual = {
  /** Serves desktop and tablet, and every width when `mobile` is null. */
  desktop: CaseStudyImageAsset
  /** A genuine phone-width capture, or `null` when none honestly exists. */
  mobile: CaseStudyImageAsset | null
}

export type CaseStudyProject = {
  id: string
  name: string
  /** Public URL safe to link for a public visitor, or `null`. */
  url: string | null
  /** Display domain, or `null` when no public host should be shown. */
  domain: string | null
  summary: string
  category: string
  tags: readonly string[]
  /** Project-specific external link label, or `null` when no link is rendered. */
  externalLinkLabel: string | null
  /** Quiet status line shown when a project has no public link. */
  accessNote: string | null
  publiclyAccessible: boolean
  /** The art direction for this card, or `null` for a text-only project. */
  visual: CaseStudyVisual | null
  /** Required whenever `visual` is set. */
  imageAlt: string | null
}

export const DESKTOP_VISUAL_WIDTH = 1280
export const DESKTOP_VISUAL_HEIGHT = 800
export const MOBILE_VISUAL_WIDTH = 390
export const MOBILE_VISUAL_HEIGHT = 844

const desktopAsset = (src: string, kind: CaseStudyImageKind = 'screenshot'): CaseStudyImageAsset => ({
  src,
  width: DESKTOP_VISUAL_WIDTH,
  height: DESKTOP_VISUAL_HEIGHT,
  kind,
})

const mobileAsset = (src: string, kind: CaseStudyImageKind = 'screenshot'): CaseStudyImageAsset => ({
  src,
  width: MOBILE_VISUAL_WIDTH,
  height: MOBILE_VISUAL_HEIGHT,
  kind,
})

export const CASE_STUDY_PROJECTS: readonly CaseStudyProject[] = [
  {
    id: 'sp-photo-station',
    name: 'SP Photo Station',
    url: 'https://spphotostation.com',
    domain: 'spphotostation.com',
    summary:
      'A venue photo-operations platform that brings on-site capture, editing, customer galleries and checkout, fulfilment, bookings and staff scheduling into one web application.',
    category: 'Venue photo-activation operations platform',
    tags: ['Operations platform', 'Multi-venue', 'E-commerce', 'Scheduling', 'Media workflow'],
    externalLinkLabel: 'Visit SP Photo Station',
    accessNote: null,
    publiclyAccessible: true,
    visual: {
      desktop: desktopAsset('/images/selected-work/sp-photo-station-desktop.webp'),
      mobile: mobileAsset('/images/selected-work/sp-photo-station-mobile.webp'),
    },
    imageAlt: 'SP Photo Station public product website',
  },
  {
    id: 'pro-photo-systems',
    name: 'Pro Photo Systems',
    // The `www` host is the published one. The apex domain does not resolve.
    url: 'https://www.prophotosystems.com',
    domain: 'www.prophotosystems.com',
    summary:
      'A studio platform for volume photography: subject-to-image matching, in-house print and packaging, parent galleries and integrated checkout in one application.',
    category: 'Volume-photography studio platform',
    tags: ['Vertical SaaS', 'Studio operations', 'Fulfilment workflow', 'Payments'],
    externalLinkLabel: 'Visit Pro Photo Systems',
    accessNote: null,
    publiclyAccessible: true,
    visual: {
      desktop: desktopAsset('/images/selected-work/pro-photo-systems-desktop.webp'),
      mobile: mobileAsset('/images/selected-work/pro-photo-systems-mobile.webp'),
    },
    imageAlt: 'Pro Photo Systems public product website',
  },
  {
    id: 'endurance-pics',
    name: 'Endurance Pics',
    // The owner-provided host did not respond when this page was last built, so
    // no link is rendered and there is nothing to capture at either width.
    url: null,
    domain: 'endurancepics.com',
    summary: 'A bespoke web application designed and built by CodeOutfitters.',
    category: 'Bespoke web application',
    tags: ['Bespoke web application'],
    externalLinkLabel: null,
    accessNote: 'Public site not reachable at time of publishing.',
    publiclyAccessible: false,
    visual: {
      desktop: desktopAsset('/images/selected-work/endurance-pics.webp', 'branded-fallback'),
      mobile: null,
    },
    imageAlt: 'CodeOutfitters presentation graphic for Endurance Pics',
  },
  {
    id: 'damagemetric-ai',
    name: 'DamageMetric AI',
    url: 'https://damagemetric.ai',
    domain: 'damagemetric.ai',
    summary: 'A pre-launch bespoke web application designed and built by CodeOutfitters.',
    category: 'Pre-launch bespoke web application',
    tags: ['Bespoke web application', 'Pre-launch'],
    // Deliberately not "View live application": the public site is a placeholder.
    externalLinkLabel: 'Visit project site',
    accessNote: 'Pre-launch. The public site is a holding page while the application is in build.',
    publiclyAccessible: true,
    visual: {
      // The public URL serves a launching-soon holding page. Capturing it would
      // present a placeholder as the application, so the branded graphic stays.
      desktop: desktopAsset('/images/selected-work/damagemetric-ai.webp', 'branded-fallback'),
      mobile: null,
    },
    imageAlt: 'CodeOutfitters presentation graphic for DamageMetric AI',
  },
  {
    id: 'voicedesk',
    name: 'CodeOutfitters VoiceDesk',
    url: 'https://voicedesk-ebon.vercel.app/dashboard',
    domain: 'voicedesk-ebon.vercel.app',
    summary:
      'A bespoke call-operations application bringing dialing, call outcomes, lead workflow and booking management into one operator dashboard.',
    category: 'Voice call-operations application',
    tags: ['Bespoke web application', 'Call operations', 'Lead workflow', 'Dashboard'],
    externalLinkLabel: 'View VoiceDesk',
    accessNote: 'Public demonstration application.',
    publiclyAccessible: true,
    // Both captures are genuine views of the public alias above, sanitized in the
    // page before capture: workspace, caller, lead and booking values are neutral
    // demo values, and layout, navigation and hierarchy are untouched.
    visual: {
      desktop: desktopAsset('/images/selected-work/voicedesk-desktop.webp', 'sanitized-screenshot'),
      mobile: mobileAsset('/images/selected-work/voicedesk-mobile.webp', 'sanitized-screenshot'),
    },
    imageAlt: 'VoiceDesk call-operations dashboard showing calls, lead workflow and booking management',
  },
]
