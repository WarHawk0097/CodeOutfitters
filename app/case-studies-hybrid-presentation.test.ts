import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { CASE_STUDY_VISUALS } from '@/lib/marketing/case-study-visuals'
import { SELECTED_WORK } from '@/lib/marketing/selected-work'

/**
 * Guards the hybrid state: the approved public site from `bd485a1` everywhere,
 * with the art-directed portfolio presentation on `/case-studies` alone.
 *
 * Two things can silently break here. The responsive presentation can leak back
 * onto the homepage, and a project can end up showing an image that misstates
 * what it is — a desktop capture passed off as a phone view, or a branded
 * graphic passed off as the product. Both are asserted below.
 */

const repoRoot = fileURLToPath(new URL('../', import.meta.url))

/** The commit whose public site the owner approved. */
const APPROVED_BASELINE = 'bd485a1'

const CASE_STUDIES_CLIENT = 'app/(public)/case-studies/case-studies-page-client.tsx'
const CASE_STUDIES_PAGE = 'app/(public)/case-studies/page.tsx'
const RESPONSIVE_IMAGE = 'components/case-studies/responsive-project-image.tsx'
const CASE_STUDY_CARD = 'components/case-studies/case-study-project-card.tsx'
const CASE_STUDY_VISUALS_MODULE = 'lib/marketing/case-study-visuals.ts'

/** Everything the art-directed presentation is allowed to touch. */
const CASE_STUDIES_ONLY_FILES = [RESPONSIVE_IMAGE, CASE_STUDY_CARD, CASE_STUDY_VISUALS_MODULE]

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function readSource(path: string): string {
  return readFileSync(`${repoRoot}${path}`, 'utf8')
}

function baselineSource(path: string): string {
  return git('show', `${APPROVED_BASELINE}:${path}`)
}

const trackedFiles = git('ls-files').split('\n').map((line) => line.trim()).filter(Boolean)

/** Every public-surface source except the case-studies-only files. */
const nonCaseStudiesSources = trackedFiles
  .filter((path) => /^(app|components|lib)\//.test(path))
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .filter((path) => !path.startsWith('app/(public)/case-studies/'))
  .filter((path) => !CASE_STUDIES_ONLY_FILES.includes(path))
  .filter((path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
  .map((path) => ({ path, source: readSource(path) }))

/** Reads the pixel dimensions out of a WebP container. */
function webpDimensions(path: string): { width: number; height: number; chunk: string } {
  const bytes = readFileSync(`${repoRoot}${path}`)
  expect(bytes.toString('ascii', 0, 4), `${path} RIFF header`).toBe('RIFF')
  expect(bytes.toString('ascii', 8, 12), `${path} WEBP header`).toBe('WEBP')
  const chunk = bytes.toString('ascii', 12, 16)
  if (chunk === 'VP8X') {
    return { chunk, width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) }
  }
  if (chunk === 'VP8 ') {
    return { chunk, width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === 'VP8L') {
    const packed = bytes.readUInt32LE(21)
    return { chunk, width: (packed & 0x3fff) + 1, height: ((packed >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`${path}: unrecognised WebP chunk ${chunk}`)
}

function webpChunks(path: string): readonly string[] {
  const bytes = readFileSync(`${repoRoot}${path}`)
  const chunks: string[] = []
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString('ascii', offset, offset + 4)
    const size = bytes.readUInt32LE(offset + 4)
    chunks.push(id)
    offset += 8 + size + (size % 2)
  }
  return chunks
}

const visualEntries = Object.entries(CASE_STUDY_VISUALS)
const allAssets = visualEntries.flatMap(([id, visual]) =>
  [visual.desktop, visual.mobile].filter((asset) => asset !== null).map((asset) => ({ id, asset: asset! })),
)

describe('the art-directed presentation stays on /case-studies', () => {
  it('the case-studies page renders the case-studies card', () => {
    const source = readSource(CASE_STUDIES_CLIENT)
    expect(source).toContain('CaseStudyProjectCard')
    expect(source).toContain("from '@/components/case-studies/case-study-project-card'")
  })

  it('the case-studies page no longer renders the shared homepage card', () => {
    expect(readSource(CASE_STUDIES_CLIENT)).not.toContain('<ProjectCard')
  })

  it('the homepage does not import anything from components/case-studies', () => {
    expect(readSource('app/(public)/page.tsx')).not.toContain('components/case-studies')
  })

  it('the homepage does not import the page-specific visual mapping', () => {
    expect(readSource('app/(public)/page.tsx')).not.toContain('case-study-visuals')
  })

  it('no file outside /case-studies imports the case-studies components', () => {
    const leaks = nonCaseStudiesSources
      .filter(({ source }) => source.includes('components/case-studies') || source.includes('case-study-visuals'))
      .map(({ path }) => path)
    expect(leaks).toEqual([])
  })

  it('the shared card component does not know about art direction', () => {
    const source = readSource('components/selected-work.tsx')
    expect(source).not.toContain('<picture')
    expect(source).not.toContain('case-study')
  })

  it('the shared card component is byte-for-byte the approved version', () => {
    expect(readSource('components/selected-work.tsx')).toBe(baselineSource('components/selected-work.tsx'))
  })

  it('the shared portfolio data is byte-for-byte the approved version', () => {
    expect(readSource('lib/marketing/selected-work.ts')).toBe(baselineSource('lib/marketing/selected-work.ts'))
  })

  it('the homepage is byte-for-byte the approved version', () => {
    expect(readSource('app/(public)/page.tsx')).toBe(baselineSource('app/(public)/page.tsx'))
  })

  it('the case-studies route entry is byte-for-byte the approved version', () => {
    expect(readSource(CASE_STUDIES_PAGE)).toBe(baselineSource(CASE_STUDIES_PAGE))
  })
})

describe('the case-studies page keeps the shared canonical project content', () => {
  it('reads projects from the shared source', () => {
    const source = readSource(CASE_STUDIES_CLIENT)
    expect(source).toContain("from '@/lib/marketing/selected-work'")
    expect(source).toContain('SELECTED_WORK.map')
  })

  it('the card restates no project copy of its own', () => {
    const source = readSource(CASE_STUDY_CARD)
    for (const project of SELECTED_WORK) {
      expect(source, `${project.id} name`).not.toContain(project.name)
      expect(source, `${project.id} summary`).not.toContain(project.summary)
      expect(source, `${project.id} category`).not.toContain(project.category)
      if (project.domain) expect(source, `${project.id} domain`).not.toContain(project.domain)
      if (project.url) expect(source, `${project.id} url`).not.toContain(project.url)
      if (project.accessNote) expect(source, `${project.id} note`).not.toContain(project.accessNote)
    }
  })

  it('the visual mapping carries no project copy either', () => {
    const source = readSource(CASE_STUDY_VISUALS_MODULE)
    for (const project of SELECTED_WORK) {
      expect(source, `${project.id} summary`).not.toContain(project.summary)
      if (project.url) expect(source, `${project.id} url`).not.toContain(project.url)
    }
  })

  it('renders no link for a project without a public url', () => {
    const source = readSource(CASE_STUDY_CARD)
    expect(source).toContain('if (!project.url || !project.externalLinkLabel) return null')
  })

  it('opens external links safely', () => {
    expect(readSource(CASE_STUDY_CARD)).toContain('rel="noopener noreferrer"')
  })

  it('wraps no card in an outer anchor', () => {
    const source = readSource(CASE_STUDY_CARD)
    expect(source).not.toMatch(/<(a|Link)[^>]*>\s*<article/)
  })

  it('keeps VoiceDesk link-free', () => {
    const voicedesk = SELECTED_WORK.find((project) => project.id === 'voicedesk')
    expect(voicedesk?.url).toBeNull()
    expect(voicedesk?.domain).toBeNull()
    expect(voicedesk?.externalLinkLabel).toBeNull()
    expect(voicedesk?.publiclyAccessible).toBe(false)
  })
})

describe('the visual mapping is keyed by canonical project id', () => {
  it('covers every project exactly once', () => {
    expect(Object.keys(CASE_STUDY_VISUALS).sort()).toEqual(SELECTED_WORK.map((project) => project.id).sort())
  })

  it.each(visualEntries)('%s has a desktop visual', (_id, visual) => {
    expect(visual.desktop).toBeTruthy()
  })

  it.each(allAssets.map(({ id, asset }) => [id, asset] as const))(
    '%s serves a local same-origin asset',
    (_id, asset) => {
      expect(asset.src.startsWith('/images/selected-work/')).toBe(true)
      expect(asset.src.endsWith('.webp')).toBe(true)
      expect(asset.src).not.toMatch(/^https?:/)
    },
  )

  it.each(allAssets.map(({ id, asset }) => [id, asset] as const))('%s asset is tracked in the repo', (_id, asset) => {
    expect(trackedFiles).toContain(`public${asset.src}`)
  })

  it.each(allAssets.map(({ id, asset }) => [id, asset] as const))(
    '%s asset dimensions match the file',
    (_id, asset) => {
      const actual = webpDimensions(`public${asset.src}`)
      expect(actual.width).toBe(asset.width)
      expect(actual.height).toBe(asset.height)
    },
  )

  it.each(allAssets.map(({ id, asset }) => [id, asset] as const))('%s asset carries no metadata', (_id, asset) => {
    const chunks = webpChunks(`public${asset.src}`)
    for (const banned of ['EXIF', 'XMP ', 'ICCP', 'ANIM']) {
      expect(chunks, `${asset.src} ${banned}`).not.toContain(banned)
    }
  })

  it('declares a mobile visual only where a genuine phone capture exists', () => {
    const withMobile = visualEntries.filter(([, visual]) => visual.mobile !== null).map(([id]) => id)
    expect(withMobile.sort()).toEqual(['pro-photo-systems', 'sp-photo-station'])
  })

  it('every mobile visual is a portrait phone capture, not a resized desktop one', () => {
    for (const [id, visual] of visualEntries) {
      if (!visual.mobile) continue
      expect(visual.mobile.width, `${id} mobile width`).toBe(390)
      expect(visual.mobile.height, `${id} mobile height`).toBe(844)
      expect(visual.mobile.height, `${id} orientation`).toBeGreaterThan(visual.mobile.width)
      expect(visual.mobile.src, `${id} distinct file`).not.toBe(visual.desktop.src)
    }
  })

  it('never presents a branded graphic as a phone view of a product', () => {
    for (const [id, visual] of visualEntries) {
      if (visual.mobile) expect(visual.mobile.kind, `${id}`).not.toBe('branded-fallback')
    }
  })

  it('keeps the image kind consistent with the shared portfolio data', () => {
    for (const project of SELECTED_WORK) {
      expect(CASE_STUDY_VISUALS[project.id]?.desktop.kind, project.id).toBe(project.visualType)
    }
  })

  it('serves the sanitized VoiceDesk capture at every width until a phone capture exists', () => {
    const voicedesk = CASE_STUDY_VISUALS['voicedesk']
    expect(voicedesk?.desktop.src).toBe('/images/selected-work/voicedesk.webp')
    expect(voicedesk?.desktop.kind).toBe('sanitized-screenshot')
    expect(voicedesk?.mobile).toBeNull()
  })
})

describe('art direction happens in markup, not in JavaScript', () => {
  const source = readSource(RESPONSIVE_IMAGE)

  it('selects the visual with a media query', () => {
    expect(source).toContain('<picture')
    expect(source).toContain('<source')
    expect(source).toContain("MOBILE_VISUAL_MEDIA = '(max-width: 767px)'")
    expect(source).toContain('media={MOBILE_VISUAL_MEDIA}')
  })

  it('measures no viewport at runtime', () => {
    expect(source).not.toContain('window.innerWidth')
    expect(source).not.toContain('matchMedia')
    expect(source).not.toContain('useState')
    expect(source).not.toContain('useEffect')
    expect(source).not.toContain('ResizeObserver')
  })

  it('embeds no frame and requests nothing from a project domain', () => {
    expect(source).not.toContain('<iframe')
    expect(source).not.toContain('fetch(')
    expect(source).not.toMatch(/https?:\/\//)
  })

  it('emits no source element when a project has no phone capture', () => {
    expect(source).toContain('{mobile ? (')
  })

  it('the card renders the responsive image', () => {
    expect(readSource(CASE_STUDY_CARD)).toContain('<ResponsiveProjectImage')
  })
})

describe('the case-studies styling cannot reach another page', () => {
  it('scopes every rule under the case-studies list', () => {
    const styles = readSource(CASE_STUDY_CARD).split('CaseStudyCardStyles')[1] ?? ''
    const selectors = [...styles.matchAll(/^\s*([.@][^{]*)\{/gm)].map((match) => match[1].trim())
    expect(selectors.length).toBeGreaterThan(0)
    for (const selector of selectors) {
      if (selector.startsWith('@media')) continue
      expect(selector, selector).toMatch(/^\.cs-list\b/)
    }
  })

  it('overrides the shared landscape ratio only at phone widths', () => {
    const source = readSource(CASE_STUDY_CARD)
    expect(source).toContain('@media(max-width:767px)')
    expect(source).toContain('aspect-ratio:390/844')
  })

  it('keeps loading the approved shared card styles', () => {
    expect(readSource(CASE_STUDIES_CLIENT)).toContain('<SelectedWorkStyles />')
  })
})

describe('the rest of the public site is unchanged from the approved baseline', () => {
  const untouched = [
    'app/(public)/services/page.tsx',
    'app/(public)/industries/page.tsx',
    'app/(public)/process/page.tsx',
    'app/(public)/about/page.tsx',
    'app/(public)/security/page.tsx',
    'app/(public)/contact/contact-page-client.tsx',
    'app/(public)/layout.tsx',
    'app/layout.tsx',
    'app/sitemap.ts',
    'components/navbar.tsx',
    'components/footer.tsx',
    'components/hero.tsx',
    'components/capabilities.tsx',
  ].filter((path) => trackedFiles.includes(path))

  it.each(untouched)('%s is byte-for-byte the approved version', (path) => {
    expect(readSource(path)).toBe(baselineSource(path))
  })

  it('changes nothing outside the case-studies page and its assets', () => {
    const changed = git('diff', '--name-only', APPROVED_BASELINE, '--')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((path) => !path.startsWith('app/(public)/case-studies/'))
      .filter((path) => !CASE_STUDIES_ONLY_FILES.includes(path))
      .filter((path) => !path.startsWith('public/images/selected-work/'))
      .filter((path) => !path.endsWith('.test.ts'))
    expect(changed).toEqual([])
  })

  it('adds no raster format other than WebP to the portfolio', () => {
    expect(trackedFiles.filter((path) => /images\/selected-work\/.*\.(png|jpe?g|gif)$/i.test(path))).toEqual([])
  })
})
