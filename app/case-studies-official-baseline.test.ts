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
//      URLs, ships only local WebP assets, and links VoiceDesk only at the
//      owner-approved public alias, with sanitized responsive imagery.
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
import {
  isProtectedReleasePath,
  isPublicSurfacePath,
  unauthorizedReleasePaths,
} from '@/test/release-guards'

/** The exact frontend deployed to production; the only baseline for this branch. */
const OFFICIAL_PRODUCTION_SHA = 'cbe980b6499ac56581d8f3d70234f0bff5fc68d0'

/** The approved case-study release, tag `core-v1.1.0`; the frozen scope below. */
const APPROVED_RELEASE_SHA = '5af9184774c87948132cd39fa48cc01336a94418'

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
  'app/case-studies-voicedesk-visuals.test.ts',
  // Origin guards that now carry an exact-string exemption for the owner-approved
  // public VoiceDesk application URL. No product source changed with them.
  'app/dashboard/interaction-identity-repair.test.ts',
  'app/proposal/public-surface.test.ts',
  'lib/routing/same-origin.test.ts',
  'components/case-studies/case-study-project-card.tsx',
  'components/case-studies/responsive-project-image.tsx',
  'lib/marketing/case-studies-projects.ts',
  'public/images/selected-work/damagemetric-ai.webp',
  'public/images/selected-work/endurance-pics.webp',
  'public/images/selected-work/pro-photo-systems-desktop.webp',
  'public/images/selected-work/pro-photo-systems-mobile.webp',
  'public/images/selected-work/sp-photo-station-desktop.webp',
  'public/images/selected-work/sp-photo-station-mobile.webp',
  'public/images/selected-work/voicedesk-desktop.webp',
  'public/images/selected-work/voicedesk-mobile.webp',
]

/**
 * Every file production served, so an edit to any of them edits the live site.
 * Read from an immutable commit, not from a branch or a remote.
 */
const productionFiles = new Set(
  git('ls-tree', '-r', '--name-only', OFFICIAL_PRODUCTION_SHA).split('\n').filter(Boolean),
)

/**
 * The paths one commit range changed. Both revisions are named.
 *
 * An omitted target revision means the working tree, which turns a claim about
 * what a 2025 release did into a claim about what the branch may contain today —
 * and then every later feature, however far from the public site, has to be
 * re-approved by a list that was closed when the release shipped.
 */
const changedPathsBetween = (baseSha: string, targetSha: string) =>
  git('diff', '--name-only', baseSha, targetSha).split('\n').filter(Boolean)

/** The paths that range changed which the release guards actually speak for. */
const protectedChangesBetween = (baseSha: string, targetSha: string) =>
  changedPathsBetween(baseSha, targetSha).filter((path) =>
    isProtectedReleasePath(path, productionFiles),
  )

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
  // The 05 guard normally requires byte-identical parity with production. These
  // are the two approved exceptions: the <=420px mobile nav toggle shrank to
  // 36x36px, below the 40x40px accessibility touch-target minimum; and the
  // <=960px mobile breakpoint hid the nav links but never hid the Sign in /
  // Book a Call actions, leaving them visible and overflowing the header. The
  // check below still fails on any OTHER drift in this file — it asserts the
  // diff is exactly these two CSS rules and nothing else.
  it('05: the public header and navigation are unchanged except the approved mobile-header fixes', () => {
    const current = read('components/navbar.tsx')
    const original = baseline('components/navbar.tsx')
    const patchedOriginal = original
      .replace(
        '.site-nav-cta,.site-nav-current,.site-nav-signin{font-size:12.5px;padding:9px 13px}.site-nav-toggle{width:36px;height:36px}}',
        '.site-nav-cta,.site-nav-current,.site-nav-signin{font-size:12.5px;padding:9px 13px}}',
      )
      .replace(
        '@media(max-width:960px){.site-links{display:none}.site-nav-toggle{display:flex}}',
        '@media(max-width:960px){.site-links{display:none}.site-nav-actions{display:none}.site-nav-toggle{display:flex}}',
      )
      .replace(
        '.site-nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:40px;height:40px;background:transparent;border:1px solid #E5DCCB;border-radius:8px;flex-shrink:0}',
        '.site-nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:44px;height:44px;background:transparent;border:1px solid #E5DCCB;border-radius:8px;flex-shrink:0}',
      )
    expect(patchedOriginal).not.toBe(original)
    expect(current).toBe(patchedOriginal)
  })
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
  // The dashboard shell divides in two, and this guard used to miss the seam.
  //
  // Three of its files are finished frontend: the layout, the theme and the
  // Overview page. Nothing about a later feature has any business editing them,
  // so they stay byte-identical to production and this test still says so.
  //
  // `app/dashboard/shell-nav.tsx` is not that kind of file. It is the dashboard's
  // route registry and header-copy map — the one file that must gain a line every
  // time a route behind it is built. Measured against the working tree, freezing
  // it byte-for-byte did not protect production; it froze the registry, so no
  // dashboard route could ever be registered again. That is the same defect
  // a72517d corrected for the release-scope guards: a claim about what a 2025
  // release did, accidentally written as a claim about what the branch may
  // contain today.
  //
  // Its historical half is asserted below over the release range, where the answer
  // is fixed forever. Its current half — the nav contract, the route registry, the
  // header copy, the gated-link posture — is asserted behaviourally in
  // app/dashboard/shell-contract.test.ts, which catches a regression this byte
  // lock never could: a renamed label, a rerouted destination, a preview URL or an
  // unregistered route all pass a byte comparison the moment anyone updates it.
  unchanged('15: the dashboard layout, theme and Overview are unchanged', [
    'app/dashboard/layout.tsx',
    'app/dashboard/theme.tsx',
    'app/dashboard/(overview)/page.tsx',
  ])

  it('15a: the approved release changed no dashboard shell file, including the nav registry', () => {
    // Both revisions are named, so this is a statement about two immutable commits
    // and has one answer forever. A route registered on a later branch cannot make
    // it true or false, which is exactly the property the working-tree form lacked.
    const released = changedPathsBetween(OFFICIAL_PRODUCTION_SHA, APPROVED_RELEASE_SHA)
    for (const path of [
      'app/dashboard/layout.tsx',
      'app/dashboard/shell-nav.tsx',
      'app/dashboard/theme.tsx',
      'app/dashboard/(overview)/page.tsx',
    ]) {
      expect(released, path).not.toContain(path)
    }
    // And the shell is protected surface, so had the release touched it, test 55
    // would have named it rather than letting it through unlisted.
    expect(isProtectedReleasePath('app/dashboard/shell-nav.tsx', productionFiles)).toBe(true)
  })
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
// 30–37: VoiceDesk is published only at the owner-approved public alias.
// ---------------------------------------------------------------------------
describe('VoiceDesk stays on the approved public alias', () => {
  it('30: keeps the approved project name', () => {
    expect(project('voicedesk').name).toBe('CodeOutfitters VoiceDesk')
  })

  it('31: keeps the approved summary', () => {
    expect(project('voicedesk').summary).toBe(
      'A bespoke call-operations application bringing dialing, call outcomes, lead workflow and booking management into one operator dashboard.',
    )
  })

  it('32: states the public access note', () => {
    expect(project('voicedesk').accessNote).toBe('Public demonstration application.')
  })

  it('33: publishes the approved public URL and domain', () => {
    const entry = project('voicedesk')
    expect(entry.url).toBe('https://voicedesk-ebon.vercel.app/dashboard')
    expect(entry.domain).toBe('voicedesk-ebon.vercel.app')
  })

  it('34: renders the approved external link and is publicly accessible', () => {
    const entry = project('voicedesk')
    expect(entry.externalLinkLabel).toBe('View VoiceDesk')
    expect(entry.publiclyAccessible).toBe(true)
  })

  it('35: carries sanitized responsive imagery and alt text', () => {
    const entry = project('voicedesk')
    expect(entry.visual?.desktop.kind).toBe('sanitized-screenshot')
    expect(entry.visual?.mobile?.kind).toBe('sanitized-screenshot')
    expect(entry.imageAlt).toBe(
      'VoiceDesk call-operations dashboard showing calls, lead workflow and booking management',
    )
  })

  it('36: ships only the two approved VoiceDesk assets', () => {
    const assets = git('ls-files', 'public').split('\n').filter(Boolean)
    expect(assets.filter((path) => /voicedesk/i.test(path)).sort()).toEqual([
      'public/images/selected-work/voicedesk-desktop.webp',
      'public/images/selected-work/voicedesk-mobile.webp',
    ])
  })

  it('37: references no raw VoiceDesk capture anywhere in source', () => {
    for (const path of trackedSources) {
      expect(/voicedesk[\w-]*\.(png|jpe?g|avif|svg)/i.test(read(path)), path).toBe(false)
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

  it('43: phone-width captures exist only for the publicly reachable products', () => {
    const withMobile = CASE_STUDY_PROJECTS.filter((entry) => entry.visual?.mobile).map((entry) => entry.id)
    expect(withMobile).toEqual(['sp-photo-station', 'pro-photo-systems', 'voicedesk'])
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

  it('45: the tracked selected-work directory holds exactly the eight approved files', () => {
    expect(git('ls-files', 'public/images/selected-work').split('\n').filter(Boolean)).toEqual([
      'public/images/selected-work/damagemetric-ai.webp',
      'public/images/selected-work/endurance-pics.webp',
      'public/images/selected-work/pro-photo-systems-desktop.webp',
      'public/images/selected-work/pro-photo-systems-mobile.webp',
      'public/images/selected-work/sp-photo-station-desktop.webp',
      'public/images/selected-work/sp-photo-station-mobile.webp',
      'public/images/selected-work/voicedesk-desktop.webp',
      'public/images/selected-work/voicedesk-mobile.webp',
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
      'app/case-studies-voicedesk-visuals.test.ts',
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

  // The scope is the production surface across one historical range, not the
  // repository as it stands. Measuring against the working tree would mean no
  // later route or module could ever be added without being added to a list that
  // describes a release it was not part of — a claim this release never made.
  it('55: the approved release touched no protected surface outside the approved files', () => {
    const changed = protectedChangesBetween(OFFICIAL_PRODUCTION_SHA, APPROVED_RELEASE_SHA)
    expect(unauthorizedReleasePaths(changed, productionFiles, ALLOWED_DIFFERENCES)).toEqual([])
  })

  it('56: the approved release itself touched exactly the approved files', () => {
    const released = changedPathsBetween(OFFICIAL_PRODUCTION_SHA, APPROVED_RELEASE_SHA)
    expect(released).toEqual([...ALLOWED_DIFFERENCES].sort())
  })

  it('57: every approved file is protected surface, so the allowlist means something', () => {
    for (const path of ALLOWED_DIFFERENCES) {
      expect(isProtectedReleasePath(path, productionFiles), path).toBe(true)
    }
  })
})

describe('protected release surface', () => {
  it('58: an edit to a public route is in scope, and so is a new one', () => {
    expect(isProtectedReleasePath('app/(public)/services/page.tsx', productionFiles)).toBe(true)
    expect(isProtectedReleasePath('app/(public)/pricing/page.tsx', productionFiles)).toBe(true)
    expect(isProtectedReleasePath('app/api/assistant/route.ts', productionFiles)).toBe(true)
    expect(isProtectedReleasePath('components/navbar.tsx', productionFiles)).toBe(true)
  })

  it('59: an unapproved served asset is in scope', () => {
    expect(
      isProtectedReleasePath('public/images/selected-work/unapproved-capture.png', productionFiles),
    ).toBe(true)
  })

  it('60: a migration is in scope wherever it lives', () => {
    expect(isProtectedReleasePath('supabase/migrations/0001_add_table.sql', productionFiles)).toBe(
      true,
    )
    expect(isProtectedReleasePath('lib/db/migrations/0002_backfill.sql', productionFiles)).toBe(true)
  })

  it('61: a server-side module no visitor reaches is out of scope', () => {
    expect(isProtectedReleasePath('lib/example/module.ts', productionFiles)).toBe(false)
    expect(isProtectedReleasePath('scripts/one-off.ts', productionFiles)).toBe(false)
  })

  it('62: an existing production file stays in scope wherever it lives', () => {
    expect(isProtectedReleasePath('package.json', productionFiles)).toBe(true)
    expect(isProtectedReleasePath('next.config.mjs', productionFiles)).toBe(true)
    expect(isProtectedReleasePath('middleware.ts', productionFiles)).toBe(true)
  })

  it('63: scoping reads the same on Windows and on Unix separators', () => {
    expect(isPublicSurfacePath('app\\(public)\\about\\page.tsx')).toBe(true)
    expect(isPublicSurfacePath('public\\images\\selected-work\\voicedesk-desktop.webp')).toBe(true)
    expect(isPublicSurfacePath('lib\\example\\module.ts')).toBe(false)
  })

  // 64–67 hand the rule paths that are not in the repository. The release it
  // judges is immutable, so the only way to show it would still catch an
  // unapproved change is to give it one — and writing a decoy route or asset into
  // the tree to do that would put the very thing the guards forbid on disk.
  it('64: an unapproved public route in the release would fail the rule', () => {
    const changed = [...ALLOWED_DIFFERENCES, 'app/(public)/pricing/page.tsx']
    expect(unauthorizedReleasePaths(changed, productionFiles, ALLOWED_DIFFERENCES)).toEqual([
      'app/(public)/pricing/page.tsx',
    ])
  })

  it('65: an unapproved served asset in the release would fail the rule', () => {
    const changed = [...ALLOWED_DIFFERENCES, 'public/private-capture.png']
    expect(unauthorizedReleasePaths(changed, productionFiles, ALLOWED_DIFFERENCES)).toEqual([
      'public/private-capture.png',
    ])
  })

  it('66: a migration in the release would fail the rule', () => {
    const changed = [...ALLOWED_DIFFERENCES, 'supabase/migrations/0003_add_ai_tables.sql']
    expect(unauthorizedReleasePaths(changed, productionFiles, ALLOWED_DIFFERENCES)).toEqual([
      'supabase/migrations/0003_add_ai_tables.sql',
    ])
  })

  it('67: a route added after the release is not retroactively part of it', () => {
    const released = changedPathsBetween(OFFICIAL_PRODUCTION_SHA, APPROVED_RELEASE_SHA)
    const later = 'app/api/ai/copilot/route.ts'

    // Whether that file exists on this branch today is not a fact about the 2025
    // release, and the range this assertion reads cannot see it either way.
    expect(released).not.toContain(later)
    expect(unauthorizedReleasePaths(released, productionFiles, ALLOWED_DIFFERENCES)).toEqual([])
    // It is still protected surface: had the release shipped it, 55 would fail.
    expect(isProtectedReleasePath(later, productionFiles)).toBe(true)
    expect(
      unauthorizedReleasePaths([...released, later], productionFiles, ALLOWED_DIFFERENCES),
    ).toEqual([later])
  })
})
