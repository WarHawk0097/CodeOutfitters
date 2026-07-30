/**
 * The one source of truth for the public portfolio. The homepage section and
 * `/case-studies` both import this list — project copy lives nowhere else.
 *
 * Owner-approved facts only. No metrics, no outcomes, no timelines, no team
 * sizes, no technology stacks, no testimonials: nothing here is inferred from a
 * product name or guessed from a screenshot.
 *
 * Safety rules that this file encodes:
 * - `url` is `null` for any application without an appropriate public URL. A
 *   null url renders as plain status text, never as an anchor.
 * - VoiceDesk's owner-supplied route is an unauthenticated operational
 *   dashboard containing phone-number-shaped records, so it is deliberately
 *   absent from this module. It must not be added to portfolio data, metadata,
 *   structured data, sitemap or alt text.
 * - Pro Photo Systems publishes on the `www` host; the apex domain does not
 *   resolve, so the apex form must never be linked.
 * - Every visual is a locally served WebP under `/images/selected-work/`. No
 *   portfolio image may be hotlinked, embedded, framed or fetched at runtime
 *   from a project's own domain.
 */

/**
 * What an image actually is, so a card can never imply more than the pixels show.
 * - `screenshot`: a capture of a publicly reachable product site.
 * - `sanitized-screenshot`: an owner-supplied capture of a private application,
 *   published only after every client identifier was removed from the pixels.
 * - `branded-fallback`: a CodeOutfitters presentation graphic, not a product view.
 */
export type ProjectImageKind = 'screenshot' | 'sanitized-screenshot' | 'branded-fallback'

export type ProjectImageAsset = {
  /** Local, same-origin path. Never an absolute or remote URL. */
  src: string
  width: number
  height: number
  kind: ProjectImageKind
}

/**
 * `desktop` is always present and is what desktop and tablet render.
 * `mobile` is a genuinely separate capture at phone width, or `null` when no
 * honest mobile visual exists — in which case the desktop asset serves every
 * width rather than a fabricated one being invented for small screens.
 */
export type SelectedWorkVisual = {
  type: 'responsive-screenshots' | 'sanitized-responsive-screenshots' | 'branded-fallback'
  desktop: ProjectImageAsset
  mobile: ProjectImageAsset | null
}

export type SelectedWorkProject = {
  id: string
  name: string
  /** Public URL safe to link for a public visitor, or `null`. */
  url: string | null
  /** Display domain, or `null` when no public host should be shown. */
  domain: string | null
  summary: string
  category: string
  tags: readonly string[]
  visual: SelectedWorkVisual
  /**
   * One alt string for the card, because art direction swaps the source behind a
   * single `<img>`. It has to stay true of every asset the project can render.
   */
  imageAlt: string
  featured: boolean
  publiclyAccessible: boolean
  /** Project-specific external link label, or `null` when no link is rendered. */
  externalLinkLabel: string | null
  /** Quiet status line shown when a project has no public link. */
  accessNote: string | null
}

export const DESKTOP_VISUAL_WIDTH = 1280
export const DESKTOP_VISUAL_HEIGHT = 800
export const MOBILE_VISUAL_WIDTH = 390
export const MOBILE_VISUAL_HEIGHT = 844

const desktopScreenshot = (src: string, kind: ProjectImageKind = 'screenshot'): ProjectImageAsset => ({
  src,
  width: DESKTOP_VISUAL_WIDTH,
  height: DESKTOP_VISUAL_HEIGHT,
  kind,
})

const mobileScreenshot = (src: string, kind: ProjectImageKind = 'screenshot'): ProjectImageAsset => ({
  src,
  width: MOBILE_VISUAL_WIDTH,
  height: MOBILE_VISUAL_HEIGHT,
  kind,
})

export const SELECTED_WORK: readonly SelectedWorkProject[] = [
  {
    id: 'sp-photo-station',
    name: 'SP Photo Station',
    url: 'https://spphotostation.com',
    domain: 'spphotostation.com',
    summary:
      'A venue photo-operations platform that brings on-site capture, editing, customer galleries and checkout, fulfilment, bookings and staff scheduling into one web application.',
    category: 'Venue photo-activation operations platform',
    tags: ['Operations platform', 'Multi-venue', 'E-commerce', 'Scheduling', 'Media workflow'],
    visual: {
      type: 'responsive-screenshots',
      desktop: desktopScreenshot('/images/selected-work/sp-photo-station-desktop.webp'),
      mobile: mobileScreenshot('/images/selected-work/sp-photo-station-mobile.webp'),
    },
    imageAlt: 'SP Photo Station public product website',
    featured: true,
    publiclyAccessible: true,
    externalLinkLabel: 'Visit SP Photo Station',
    accessNote: null,
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
    visual: {
      type: 'responsive-screenshots',
      desktop: desktopScreenshot('/images/selected-work/pro-photo-systems-desktop.webp'),
      mobile: mobileScreenshot('/images/selected-work/pro-photo-systems-mobile.webp'),
    },
    imageAlt: 'Pro Photo Systems public product website',
    featured: false,
    publiclyAccessible: true,
    externalLinkLabel: 'Visit Pro Photo Systems',
    accessNote: null,
  },
  {
    id: 'endurance-pics',
    name: 'Endurance Pics',
    // Owner-provided URL is recorded, but the host did not respond when this
    // page was last built, so no link is rendered and no screenshot exists.
    url: null,
    domain: 'endurancepics.com',
    summary: 'A bespoke web application designed and built by CodeOutfitters.',
    category: 'Bespoke web application',
    tags: ['Bespoke web application'],
    visual: {
      type: 'branded-fallback',
      desktop: desktopScreenshot('/images/selected-work/endurance-pics.webp', 'branded-fallback'),
      // No mobile capture: the public host still does not serve a site, and a
      // mobile view of a project must never be invented.
      mobile: null,
    },
    imageAlt: 'CodeOutfitters presentation graphic for Endurance Pics',
    featured: false,
    publiclyAccessible: false,
    externalLinkLabel: null,
    accessNote: 'Public site not reachable at time of publishing.',
  },
  {
    id: 'damagemetric-ai',
    name: 'DamageMetric AI',
    url: 'https://damagemetric.ai',
    domain: 'damagemetric.ai',
    summary: 'A pre-launch bespoke web application designed and built by CodeOutfitters.',
    category: 'Pre-launch bespoke web application',
    tags: ['Bespoke web application', 'Pre-launch'],
    visual: {
      type: 'branded-fallback',
      // The public URL serves a launching-soon holding page. Capturing it would
      // present a placeholder as the application, so the branded graphic stays.
      desktop: desktopScreenshot('/images/selected-work/damagemetric-ai.webp', 'branded-fallback'),
      mobile: null,
    },
    imageAlt: 'CodeOutfitters presentation graphic for DamageMetric AI',
    featured: false,
    publiclyAccessible: true,
    // Deliberately not "View live application": the public site is a placeholder.
    externalLinkLabel: 'Visit project site',
    accessNote: 'Pre-launch. The public site is a holding page while the application is in build.',
  },
  {
    id: 'voicedesk',
    name: 'CodeOutfitters VoiceDesk',
    url: null,
    domain: null,
    summary:
      'A bespoke call-operations application bringing dialing, call outcomes, lead workflow and booking management into one operator dashboard.',
    category: 'Voice call-operations application',
    tags: ['Bespoke web application', 'Call operations', 'Lead workflow', 'Dashboard'],
    visual: {
      type: 'sanitized-responsive-screenshots',
      // Owner-supplied capture of the operator console. Published only after the
      // workspace name, the account identity and the avatar initials were painted
      // out, and cropped above the recent-call and upcoming-booking rows, so no
      // name, phone number, appointment type or call record survives.
      desktop: desktopScreenshot('/images/selected-work/voicedesk-desktop.webp', 'sanitized-screenshot'),
      // No owner-provided mobile capture exists, and the application is private,
      // so its mobile layout cannot be captured. The branded graphic runs at
      // phone width instead of a resized desktop dashboard.
      mobile: desktopScreenshot('/images/selected-work/voicedesk-mobile.webp', 'branded-fallback'),
    },
    imageAlt: 'VoiceDesk call-operations application, shown with client details removed',
    featured: false,
    publiclyAccessible: false,
    externalLinkLabel: null,
    accessNote: 'Private operational application. No public demonstration environment.',
  },
]

export const FEATURED_PROJECT = SELECTED_WORK.find((project) => project.featured) ?? SELECTED_WORK[0]
export const SUPPORTING_PROJECTS = SELECTED_WORK.filter((project) => !project.featured)
