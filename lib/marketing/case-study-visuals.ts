/**
 * Art-directed visuals for `/case-studies` only.
 *
 * `lib/marketing/selected-work.ts` stays the one source of truth for what a
 * project is — name, summary, category, tags, url, link posture, access note,
 * public/private status. This module adds nothing to that and contradicts none
 * of it. All it holds is which image file `/case-studies` should show at which
 * viewport, keyed by the canonical project id.
 *
 * It is deliberately separate so the homepage keeps the approved single-image
 * presentation: nothing outside `/case-studies` imports this file.
 *
 * Safety rules that still apply here, unchanged:
 * - Every asset is a local, same-origin WebP under `/images/selected-work/`.
 *   No portfolio image is hotlinked, framed or fetched from a project domain.
 * - A `mobile` entry exists only where a genuine phone-width capture of that
 *   project exists. Where one does not, `mobile` is `null` and the desktop
 *   asset serves every width — a resized desktop shot or a branded graphic
 *   must never stand in for a phone view of the product.
 */

/**
 * What an image actually is, so a card can never imply more than the pixels show.
 * - `screenshot`: a capture of a publicly reachable product site.
 * - `sanitized-screenshot`: an owner-supplied capture of a private application,
 *   published only after every client identifier was removed from the pixels.
 * - `branded-fallback`: a CodeOutfitters presentation graphic, not a product view.
 */
export type CaseStudyImageKind = 'screenshot' | 'sanitized-screenshot' | 'branded-fallback'

export type CaseStudyImageAsset = {
  /** Local, same-origin path. Never an absolute or remote URL. */
  src: string
  width: number
  height: number
  kind: CaseStudyImageKind
}

export type CaseStudyVisual = {
  /** Always present. Serves desktop and tablet, and every width when `mobile` is null. */
  desktop: CaseStudyImageAsset
  /** A genuine phone-width capture, or `null` when none honestly exists. */
  mobile: CaseStudyImageAsset | null
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

export const CASE_STUDY_VISUALS: Readonly<Record<string, CaseStudyVisual>> = {
  'sp-photo-station': {
    desktop: desktopAsset('/images/selected-work/sp-photo-station-desktop.webp'),
    mobile: mobileAsset('/images/selected-work/sp-photo-station-mobile.webp'),
  },
  'pro-photo-systems': {
    desktop: desktopAsset('/images/selected-work/pro-photo-systems-desktop.webp'),
    mobile: mobileAsset('/images/selected-work/pro-photo-systems-mobile.webp'),
  },
  'endurance-pics': {
    // The public host still does not serve a site, so there is nothing to capture
    // at either width and the branded graphic runs everywhere.
    desktop: desktopAsset('/images/selected-work/endurance-pics.webp', 'branded-fallback'),
    mobile: null,
  },
  'damagemetric-ai': {
    // The public URL serves a launching-soon holding page. Capturing it would
    // present a placeholder as the application, so the branded graphic stays.
    desktop: desktopAsset('/images/selected-work/damagemetric-ai.webp', 'branded-fallback'),
    mobile: null,
  },
  voicedesk: {
    // Owner-supplied capture of the operator console, published only after the
    // workspace name, the account identity and the avatar initials were painted
    // out, and cropped above the recent-call and upcoming-booking rows, so no
    // name, phone number, appointment type or call record survives.
    desktop: desktopAsset('/images/selected-work/voicedesk.webp', 'sanitized-screenshot'),
    // No phone-width capture of the application exists. The application is
    // private, so one cannot be taken here, and the sanitized desktop capture
    // serves every width until an owner-supplied phone capture is provided.
    mobile: null,
  },
}

/** The visual for a canonical project id, or `null` for a project with none. */
export function caseStudyVisual(id: string): CaseStudyVisual | null {
  return CASE_STUDY_VISUALS[id] ?? null
}
