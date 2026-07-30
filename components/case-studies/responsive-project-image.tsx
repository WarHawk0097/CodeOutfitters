'use client'

import { getImageProps } from 'next/image'
import type { CaseStudyVisual } from '@/lib/marketing/case-study-visuals'

/**
 * Art-directed portfolio image, used by `/case-studies` only.
 *
 * The homepage keeps the approved single-image presentation and does not import
 * this component.
 *
 * Art direction is done in markup with `<picture>` and a media query, so the
 * browser picks one file before layout. There is no viewport measurement in
 * JavaScript, no state, no effect and no second request: exactly one image is
 * fetched per viewport, and the first server-rendered paint is already correct.
 */

/** Phones get the portrait capture; tablets and up keep the desktop one. */
export const MOBILE_VISUAL_MEDIA = '(max-width: 767px)'

export function ResponsiveProjectImage({
  visual,
  alt,
  featured,
}: {
  visual: CaseStudyVisual
  alt: string
  featured: boolean
}) {
  const desktopSizes = featured ? '(max-width:900px) 92vw, 560px' : '(max-width:820px) 92vw, 420px'

  const { props: desktop } = getImageProps({
    alt,
    src: visual.desktop.src,
    width: visual.desktop.width,
    height: visual.desktop.height,
    sizes: desktopSizes,
  })

  const mobile = visual.mobile
    ? getImageProps({
        alt,
        src: visual.mobile.src,
        width: visual.mobile.width,
        height: visual.mobile.height,
        sizes: '92vw',
      }).props
    : null

  return (
    // The class drives the phone-width aspect ratio, so a portrait capture is
    // never squeezed into the landscape box. Without a mobile asset the desktop
    // capture keeps its own ratio at every width.
    <picture className={`cs-picture${mobile ? ' cs-picture--mobile' : ''}`}>
      {mobile ? (
        <source
          media={MOBILE_VISUAL_MEDIA}
          srcSet={mobile.srcSet ?? mobile.src}
          sizes={mobile.sizes}
          width={mobile.width}
          height={mobile.height}
        />
      ) : null}
      <img {...desktop} alt={alt} />
    </picture>
  )
}
