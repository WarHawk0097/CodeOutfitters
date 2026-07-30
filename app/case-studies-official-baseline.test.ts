// Official-production parity and `/case-studies` safety guards.
//
// This branch starts from the exact frontend deployed at the production origin
// (`cbe980b6499ac56581d8f3d70234f0bff5fc68d0`, tag `core-v1.0.1`) and adds one
// thing: the selected-work `/case-studies` route. Two properties therefore have
// to hold at all times, and both are asserted here rather than reviewed by eye:
//
//   1. Every official file — homepage, shared layout, header, footer, the other
//      public pages, the dashboard — is byte-identical to production.
//   2. `/case-studies` presents only owner-approved facts, links only public
//      URLs, ships only local WebP assets, and presents VoiceDesk as text with
//      no image element, no media container and no external link at any width.
//
// Tests are numbered so a failure names the guarantee it broke.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CASE_STUDY_PROJECTS,
  DESKTOP_VISUAL_HEIGHT,
  DESKTOP_VISUAL_WIDTH,
  MOBILE_VISUAL_HEIGHT,
  MOBILE_VISUAL_WIDTH,
  type CaseStudyProject,
} from '@/lib/marketing/case-studies-projects'

/** The exact frontend deployed to production; the only baseline for this branch. */
const OFFICIAL_PRODUCTION_SHA = 'cbe980b6499ac56581d8f3d70234f0bff5fc68d0'

/** This file, excluded from the scans that must quote the strings they forbid. */
const OWN_PATH = 'app/case-studies-official-baseline.test.ts'

const repo = fileURLToPath(new URL('../', import.meta.url))
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const read = (path: string) => readFileSync(join(repo, path), 'utf8')
const baseline = (path: string) => git('show', `${OFFICIAL_PRODUCTION_SHA}:${path}`)
const bytes = (path: string) => readFileSync(join(repo, path))

/** Every file this branch is allowed to differ from production by. */
const ALLOWED_DIFFERENCES = [
  'app/(public)/case-studies/page.tsx',
  'app/(public)/case-studies/case-studies-page-client.tsx',
  'app/case-studies-official-baseline.test.ts',
  'components/case-studies/case-study-project-card.tsx',
  'components/case-studies/responsive-project-image.tsx',
  'lib/marketing/case-studies-projects.ts',
  'public/images/selected-work/damagemetric-ai.webp',
  'public/images/selected-work/endurance-pics.webp',
  'public/images/selected-work/pro-photo-systems-desktop.webp',
  'public/images/selected-work/pro-photo-systems-mobile.webp',
  'public/images/selected-work/sp-photo-station-desktop.webp',
  'public/images/selected-work/sp-photo-station-mobile.webp',
]

/** Files that must match production byte for byte, grouped by the surface they own. */
const unchanged = (label: string, paths: string[]) =>
  it(label, () => {
    for (const path of paths) expect(read(path), path).toBe(baseline(path))
  })

const project = (id: string): CaseStudyProject => {
  const found = CASE_STUDY_PROJECTS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`no project ${id}`)
  return found
}

const cardSource = read('components/case-studies/case-study-project-card.tsx')
const imageSource = read('components/case-studies/responsive-project-image.tsx')
const pageSource = read('app/(public)/case-studies/case-studies-page-client.tsx')
const dataSource = read('lib/marketing/case-studies-projects.ts')
const caseStudySources = [cardSource, imageSource, pageSource, dataSource]

/** Tracked source files, so a scan cannot be defeated by an untracked copy. */
const trackedSources = git('ls-files')
  .split('\n')
  .filter((path) => /\.(ts|tsx|css|json|mjs)$/.test(path))
  .filter((path) => !path.startsWith('node_modules/'))

// ---------------------------------------------------------------------------
// 1–15: the official production frontend is untouched.
// ---------------------------------------------------------------------------
describe('official production parity', () => {
  unchanged('01: the homepage is the official production homepage', ['app/(public)/page.tsx'])
  unchanged('02: the public layout is unchanged', ['app/(public)/layout.tsx'])
  unchanged('03: the root layout is unchanged', ['app/layout.tsx'])
  unchanged('04: the global stylesheet is unchanged', ['app/globals.css'])
  unchanged('05: the public header and navigation are unchanged', ['components/navbar.tsx'])
  unchanged('06: the public footer is unchanged', ['components/footer.tsx'])
  unchanged('07: the announcement bar and motion mode are unchanged', [
    'components/announcement-bar.tsx',
    'components/motion-mode-provider.tsx',
  ])
  unchanged('08: the services page is unchanged', ['app/(public)/services/page.tsx'])
  unchanged('09: the industries page is unchanged', ['app/(public)/industries/page.tsx'])
  unchanged('10: the process page is unchanged', ['app/(public)/process/page.tsx'])
  unchanged('11: the about page is unchanged', [
    'app/(public)/about/page.tsx',
    'app/(public)/about/about-page-client.tsx',
  ])
  unchanged('12: the security page is unchanged', [
    'app/(public)/security/page.tsx',
    'app/(public)/security/security-page-client.tsx',
  ])
  unchanged('13: the contact page and enquiry UI are unchanged', [
    'app/(public)/contact/page.tsx',
    'app/(public)/contact/contact-page-client.tsx',
    'components/contact.tsx',
  ])
  unchanged('14: login is unchanged', [
    'app/login/page.tsx',
    'app/login/login-form.tsx',
    'app/login/login-frame.tsx',
    'app/login/credentials.ts',
  ])
  unchanged('15: the dashboard shell and theme are unchanged', [
    'app/dashboard/layout.tsx',
    'app/dashboard/shell-nav.tsx',
    'app/dashboard/theme.tsx',
    'app/dashboard/(overview)/page.tsx',
  ])
})

// ---------------------------------------------------------------------------
// 16–29: the published projects say only what the owner approved.
// ---------------------------------------------------------------------------
describe('selected work data', () => {
  it('16: publishes exactly the five approved projects, in order', () => {
    expect(CASE_STUDY_PROJECTS.map((entry) => entry.id)).toEqual([
      'sp-photo-station',
      'pro-photo-systems',
      'endurance-pics',
      'damagemetric-ai',
      'voicedesk',
    ])
  })

  it('17: SP Photo Station links its exact public URL', () => {
    expect(project('sp-photo-station').url).toBe('https://spphotostation.com')
  })

  it('18: SP Photo Station shows its public domain', () => {
    expect(project('sp-photo-station').domain).toBe('spphotostation.com')
  })

  it('19: SP Photo Station carries the desktop capture', () => {
    expect(project('sp-photo-station').visual?.desktop).toMatchObject({
      src: '/images/selected-work/sp-photo-station-desktop.webp',
      width: DESKTOP_VISUAL_WIDTH,
      height: DESKTOP_VISUAL_HEIGHT,
      kind: 'screenshot',
    })
  })

  it('20: SP Photo Station carries a genuine phone-width capture', () => {
    expect(project('sp-photo-station').visual?.mobile).toMatchObject({
      src: '/images/selected-work/sp-photo-station-mobile.webp',
      width: MOBILE_VISUAL_WIDTH,
      height: MOBILE_VISUAL_HEIGHT,
      kind: 'screenshot',
    })
  })

  it('21: Pro Photo Systems links the published www host', () => {
    const entry = project('pro-photo-systems')
    expect(entry.url).toBe('https://www.prophotosystems.com')
    expect(entry.domain).toBe('www.prophotosystems.com')
  })

  it('22: the non-resolving apex host is never linked', () => {
    // This file names the forbidden form to assert it, so it scans everything else.
    for (const path of trackedSources.filter((candidate) => candidate !== OWN_PATH)) {
      expect(/https:\/\/prophotosystems\.com/.test(read(path)), path).toBe(false)
    }
  })

  it('23: Pro Photo Systems carries both captures', () => {
    const visual = project('pro-photo-systems').visual
    expect(visual?.desktop.src).toBe('/images/selected-work/pro-photo-systems-desktop.webp')
    expect(visual?.mobile?.src).toBe('/images/selected-work/pro-photo-systems-mobile.webp')
  })

  it('24: Endurance Pics renders no link', () => {
    const entry = project('endurance-pics')
    expect(entry.url).toBeNull()
    expect(entry.externalLinkLabel).toBeNull()
    expect(entry.publiclyAccessible).toBe(false)
  })

  it('25: Endurance Pics states its availability honestly', () => {
    expect(project('endurance-pics').accessNote).toBe('Public site not reachable at time of publishing.')
  })

  it('26: Endurance Pics uses the approved branded fallback and no phone capture', () => {
    const visual = project('endurance-pics').visual
    expect(visual?.desktop).toMatchObject({
      src: '/images/selected-work/endurance-pics.webp',
      kind: 'branded-fallback',
    })
    expect(visual?.mobile).toBeNull()
  })

  it('27: DamageMetric AI uses the pre-launch link label', () => {
    const entry = project('damagemetric-ai')
    expect(entry.url).toBe('https://damagemetric.ai')
    expect(entry.externalLinkLabel).toBe('Visit project site')
  })

  it('28: DamageMetric AI states that the public site is a holding page', () => {
    expect(project('damagemetric-ai').accessNote).toBe(
      'Pre-launch. The public site is a holding page while the application is in build.',
    )
  })

  it('29: DamageMetric AI uses the approved branded fallback and no phone capture', () => {
    const visual = project('damagemetric-ai').visual
    expect(visual?.desktop).toMatchObject({
      src: '/images/selected-work/damagemetric-ai.webp',
      kind: 'branded-fallback',
    })
    expect(visual?.mobile).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 30–37: VoiceDesk is a private application presented as text only.
// ---------------------------------------------------------------------------
describe('VoiceDesk stays text-only and private', () => {
  it('30: keeps the approved project name', () => {
    expect(project('voicedesk').name).toBe('CodeOutfitters VoiceDesk')
  })

  it('31: keeps the approved summary', () => {
    expect(project('voicedesk').summary).toBe(
      'A bespoke call-operations application bringing dialing, call outcomes, lead workflow and booking management into one operator dashboard.',
    )
  })

  it('32: states the private access note', () => {
    expect(project('voicedesk').accessNote).toBe(
      'Private operational application. No public demonstration environment.',
    )
  })

  it('33: publishes no URL and no domain', () => {
    const entry = project('voicedesk')
    expect(entry.url).toBeNull()
    expect(entry.domain).toBeNull()
  })

  it('34: renders no external link and is not publicly accessible', () => {
    const entry = project('voicedesk')
    expect(entry.externalLinkLabel).toBeNull()
    expect(entry.publiclyAccessible).toBe(false)
  })

  it('35: carries no visual and no alt text at any viewport', () => {
    const entry = project('voicedesk')
    expect(entry.visual).toBeNull()
    expect(entry.imageAlt).toBeNull()
  })

  it('36: ships no VoiceDesk asset in the repository', () => {
    const assets = git('ls-files', 'public').split('\n').filter(Boolean)
    expect(assets.filter((path) => /voicedesk/i.test(path))).toEqual([])
  })

  it('37: references no VoiceDesk image file anywhere in source', () => {
    for (const path of trackedSources) {
      expect(/voicedesk[\w-]*\.(webp|png|jpe?g|avif|svg)/i.test(read(path)), path).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 38–45: the assets are local, honest and metadata-free.
// ---------------------------------------------------------------------------

/** Intrinsic size from the WebP container: VP8X, lossy VP8 and lossless VP8L. */
function webpDimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 4).toString('ascii')).toBe('RIFF')
  expect(buffer.subarray(8, 12).toString('ascii')).toBe('WEBP')
  const format = buffer.subarray(12, 16).toString('ascii')
  if (format === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 }
  if (format === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
  if (format === 'VP8L') {
    const bits = buffer.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`unknown WebP format ${format}`)
}

/** Every RIFF chunk id, so metadata chunks cannot hide behind the image data. */
function webpChunks(buffer: Buffer) {
  const chunks: string[] = []
  let offset = 12
  while (offset + 8 <= buffer.length) {
    const id = buffer.subarray(offset, offset + 4).toString('ascii')
    const size = buffer.readUInt32LE(offset + 4)
    chunks.push(id)
    offset += 8 + size + (size % 2)
  }
  return chunks
}

const allAssets = CASE_STUDY_PROJECTS.flatMap((entry) =>
  entry.visual ? [entry.visual.desktop, entry.visual.mobile].filter((asset) => asset !== null) : [],
)

describe('project assets', () => {
  it('38: every declared asset exists on disk', () => {
    for (const asset of allAssets) {
      expect(existsSync(join(repo, 'public', asset.src)), asset.src).toBe(true)
    }
  })

  it('39: every asset is a local same-origin WebP under /images/selected-work/', () => {
    for (const asset of allAssets) {
      expect(asset.src.startsWith('/images/selected-work/'), asset.src).toBe(true)
      expect(asset.src.endsWith('.webp'), asset.src).toBe(true)
    }
  })

  it('40: every asset is a real WebP container', () => {
    for (const asset of allAssets) {
      expect(() => webpDimensions(bytes(join('public', asset.src)))).not.toThrow()
    }
  })

  it('41: intrinsic sizes match the declared dimensions', () => {
    for (const asset of allAssets) {
      expect(webpDimensions(bytes(join('public', asset.src))), asset.src).toEqual({
        width: asset.width,
        height: asset.height,
      })
    }
  })

  it('42: no asset carries EXIF, XMP, ICC or animation chunks', () => {
    for (const asset of allAssets) {
      const chunks = webpChunks(bytes(join('public', asset.src)))
      for (const forbidden of ['EXIF', 'XMP ', 'ICCP', 'ANIM', 'ANMF']) {
        expect(chunks.includes(forbidden), `${asset.src}:${forbidden}`).toBe(false)
      }
    }
  })

  it('43: phone-width captures exist only for the two publicly reachable product sites', () => {
    const withMobile = CASE_STUDY_PROJECTS.filter((entry) => entry.visual?.mobile).map((entry) => entry.id)
    expect(withMobile).toEqual(['sp-photo-station', 'pro-photo-systems'])
  })

  it('44: desktop assets declare 1280x800 and phone assets 390x844', () => {
    for (const asset of allAssets) {
      const expected =
        asset.width === MOBILE_VISUAL_WIDTH
          ? { width: MOBILE_VISUAL_WIDTH, height: MOBILE_VISUAL_HEIGHT }
          : { width: DESKTOP_VISUAL_WIDTH, height: DESKTOP_VISUAL_HEIGHT }
      expect({ width: asset.width, height: asset.height }, asset.src).toEqual(expected)
    }
  })

  it('45: the tracked selected-work directory holds exactly the six approved files', () => {
    expect(git('ls-files', 'public/images/selected-work').split('\n').filter(Boolean)).toEqual([
      'public/images/selected-work/damagemetric-ai.webp',
      'public/images/selected-work/endurance-pics.webp',
      'public/images/selected-work/pro-photo-systems-desktop.webp',
      'public/images/selected-work/pro-photo-systems-mobile.webp',
      'public/images/selected-work/sp-photo-station-desktop.webp',
      'public/images/selected-work/sp-photo-station-mobile.webp',
    ])
  })
})

// ---------------------------------------------------------------------------
// 46–55: rendering rules, art direction and isolation.
// ---------------------------------------------------------------------------
describe('rendering and isolation', () => {
  it('46: a project without a visual renders no media container', () => {
    expect(cardSource).toContain('{project.visual && project.imageAlt ? (')
    expect(cardSource).toContain('<div className="cs-visual">')
    // The media box exists only inside that conditional.
    expect(cardSource.split('<div className="cs-visual">')).toHaveLength(2)
  })

  it('47: a card renders an anchor only for a project with a public URL and a label', () => {
    expect(cardSource).toContain('if (!project.url || !project.externalLinkLabel) return null')
    expect(cardSource.match(/<a /g) ?? []).toHaveLength(1)
  })

  it('48: art direction is done in markup with picture and a media query', () => {
    expect(imageSource).toContain('<picture')
    expect(imageSource).toContain('media={MOBILE_VISUAL_MEDIA}')
    expect(imageSource).toContain("'(max-width: 767px)'")
  })

  it('49: art direction never measures the viewport in JavaScript', () => {
    for (const source of caseStudySources) {
      for (const forbidden of ['window.innerWidth', 'matchMedia', 'useEffect', 'useState', 'addEventListener']) {
        expect(source.includes(forbidden), forbidden).toBe(false)
      }
    }
  })

  it('50: the phone source is emitted only when a phone asset exists', () => {
    expect(imageSource).toContain('const mobile = visual.mobile')
    expect(imageSource).toContain('{mobile ? (')
    expect(imageSource.match(/<source/g) ?? []).toHaveLength(1)
  })

  it('51: no embed, frame, screenshot service or remote portfolio request', () => {
    for (const source of caseStudySources) {
      for (const forbidden of ['iframe', 'embed', 'screenshot(', 'browserless', 'fetch(', 'thum.io']) {
        expect(source.includes(forbidden), forbidden).toBe(false)
      }
    }
  })

  it('52: every class on the page is namespaced, and no shared marketing class is reused', () => {
    const classes = [...(cardSource + pageSource).matchAll(/className="([^"]+)"/g)].flatMap((match) =>
      match[1].split(/\s+/),
    )
    for (const name of classes) {
      expect(name === 'sr-only' || name.startsWith('cs-'), name).toBe(true)
    }
    for (const source of caseStudySources) expect(source.includes('sw-')).toBe(false)
  })

  it('53: nothing outside /case-studies imports the case-studies route modules', () => {
    const own = [
      'app/(public)/case-studies/page.tsx',
      'app/(public)/case-studies/case-studies-page-client.tsx',
      'components/case-studies/case-study-project-card.tsx',
      'components/case-studies/responsive-project-image.tsx',
      'lib/marketing/case-studies-projects.ts',
      'app/case-studies-official-baseline.test.ts',
    ]
    for (const path of trackedSources) {
      if (own.includes(path)) continue
      const source = read(path)
      expect(source.includes('@/components/case-studies/'), path).toBe(false)
      expect(source.includes('case-studies-projects'), path).toBe(false)
    }
  })

  it('54: the case-studies page renders the five project cards from the canonical data', () => {
    expect(pageSource).toContain("from '@/lib/marketing/case-studies-projects'")
    expect(pageSource).toContain('CASE_STUDY_PROJECTS.map((project) => (')
    expect(pageSource).toContain('<CaseStudyProjectCard key={project.id} project={project} />')
  })

  it('55: this branch differs from official production only by the approved files', () => {
    const changed = git('diff', '--name-only', OFFICIAL_PRODUCTION_SHA).split('\n').filter(Boolean)
    expect(changed.filter((path) => !ALLOWED_DIFFERENCES.includes(path))).toEqual([])
  })
})
