import { getImageProps } from 'next/image'
import type { ProjectImageAsset, SelectedWorkVisual } from '@/lib/marketing/selected-work'

/**
 * Art direction for portfolio visuals: phones get the phone capture, everything
 * from tablet up gets the desktop capture.
 *
 * The switch is a picture-source media query, so the browser picks before it
 * requests anything and downloads exactly one file: no client-side viewport
 * measurement, and no second hidden image element that would double the bytes
 * on every card.
 */
export const MOBILE_VISUAL_MEDIA = '(max-width: 767px)'

/**
 * Aspect ratio reserved for the visual before the image decodes, per viewport.
 * A portrait phone capture would be absurdly tall at card width, so it is
 * cover-cropped from the top into a 4:5 box; landscape assets keep 16:10.
 */
const DESKTOP_ASPECT = '16 / 10'
const PORTRAIT_MOBILE_ASPECT = '4 / 5'

type ResponsiveProjectImageProps = {
  visual: SelectedWorkVisual
  alt: string
  /** Rendered width hints for the desktop asset. */
  sizes: string
  /** Only ever true for an above-the-fold featured visual. */
  priority?: boolean
}

export function ResponsiveProjectImage({ visual, alt, sizes, priority = false }: ResponsiveProjectImageProps) {
  const shared = { alt, sizes, priority, loading: priority ? ('eager' as const) : ('lazy' as const) }

  // Only src/width/height travel into the image props: `kind` is data about the
  // asset, not a DOM attribute, and must not leak into the markup.
  const sourceOf = ({ src, width, height }: ProjectImageAsset) => ({ src, width, height })

  const { props: desktop } = getImageProps({ ...shared, ...sourceOf(visual.desktop) })
  const mobile = visual.mobile ? getImageProps({ ...shared, ...sourceOf(visual.mobile) }).props : null

  const mobileAspect =
    visual.mobile && visual.mobile.height > visual.mobile.width ? PORTRAIT_MOBILE_ASPECT : DESKTOP_ASPECT

  return (
    <picture
      className="sw-picture"
      style={
        {
          '--sw-desktop-aspect': DESKTOP_ASPECT,
          '--sw-mobile-aspect': mobileAspect,
        } as React.CSSProperties
      }
    >
      {mobile ? (
        <source
          media={MOBILE_VISUAL_MEDIA}
          srcSet={mobile.srcSet ?? mobile.src}
          width={mobile.width}
          height={mobile.height}
        />
      ) : null}
      {/* The single image element carries the one alt string and stays the fallback. */}
      <img {...desktop} alt={alt} />
    </picture>
  )
}
