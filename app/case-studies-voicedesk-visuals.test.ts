import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CANONICAL_ORIGIN } from '@/lib/routing/public-origin'
import { isProtectedReleasePath } from '@/test/release-guards'
import {
  CASE_STUDY_PROJECTS,
  DESKTOP_VISUAL_HEIGHT,
  DESKTOP_VISUAL_WIDTH,
  MOBILE_VISUAL_HEIGHT,
  MOBILE_VISUAL_WIDTH,
} from '@/lib/marketing/case-studies-projects'

// ---------------------------------------------------------------------------
// VoiceDesk is the only case-study project whose imagery is sanitized rather
// than captured as-is, and the only one linked at a `.vercel.app` alias. These
// tests protect both facts: the approved public alias is the only VoiceDesk
// host that may appear anywhere, it may appear only as a user-activated link,
// and the two published assets stay local, small, metadata-free WebP files.
//
// Tests are numbered so a failure name identifies the guarantee that broke.
// ---------------------------------------------------------------------------

const APPROVED_URL = 'https://voicedesk-ebon.vercel.app/dashboard'
const APPROVED_DOMAIN = 'voicedesk-ebon.vercel.app'
const DESKTOP_SRC = '/images/selected-work/voicedesk-desktop.webp'
const MOBILE_SRC = '/images/selected-work/voicedesk-mobile.webp'
const OFFICIAL_PRODUCTION_SHA = 'cbe980b6499ac56581d8f3d70234f0bff5fc68d0'
/** The approved case-study release, tag `core-v1.1.0`. */
const APPROVED_RELEASE_SHA = '5af9184774c87948132cd39fa48cc01336a94418'

const repo = fileURLToPath(new URL('../', import.meta.url))
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const read = (path: string) => readFileSync(join(repo, path), 'utf8')
const bytes = (path: string) => readFileSync(join(repo, path))

const voicedesk = CASE_STUDY_PROJECTS.find((entry) => entry.id === 'voicedesk')!
const desktopAsset = voicedesk.visual!.desktop
const mobileAsset = voicedesk.visual!.mobile!

const cardSource = read('components/case-studies/case-study-project-card.tsx')
const imageSource = read('components/case-studies/responsive-project-image.tsx')
const pageSource = read('app/(public)/case-studies/case-studies-page-client.tsx')
const projectSource = read('lib/marketing/case-studies-projects.ts')

const trackedFiles = git('ls-files').split('\n').filter(Boolean)
const trackedSources = trackedFiles.filter((path) => /\.(ts|tsx|js|jsx|mjs|cjs|css|json|xml|html)$/.test(path))
/** The shipped application surface: review artifacts under `System-Artifacts/` are not served. */
const shippedSources = trackedSources.filter((path) => /^(app|components|lib|public)\//.test(path))
const shippedNonTestSources = shippedSources.filter((path) => !/\.test\.tsx?$/.test(path))
const changedSinceProduction = git('diff', '--name-only', OFFICIAL_PRODUCTION_SHA).split('\n').filter(Boolean)
/** Every file production served, read from an immutable commit rather than a branch. */
const productionFiles = new Set(git('ls-tree', '-r', '--name-only', OFFICIAL_PRODUCTION_SHA).split('\n').filter(Boolean))
// The content scans below police what the release put in front of a visitor:
// the files production already served, plus anything added to a route, a
// component, a served asset or a migration. Server-side modules a visitor never
// reaches are a different review, and freezing them here would freeze the
// repository rather than the website.
const changedNonTestSinceProduction = changedSinceProduction
  .filter((path) => !/\.test\.tsx?$/.test(path))
  .filter((path) => isProtectedReleasePath(path, productionFiles))
const diffSinceProduction = changedNonTestSinceProduction.length
  ? git('diff', OFFICIAL_PRODUCTION_SHA, '--', ...changedNonTestSinceProduction)
  : ''

/** The published visual type is the combination of both approved asset kinds. */
const visualType =
  desktopAsset.kind === 'sanitized-screenshot' && mobileAsset.kind === 'sanitized-screenshot'
    ? 'sanitized-responsive-screenshots'
    : `${desktopAsset.kind}+${mobileAsset.kind}`

describe('VoiceDesk project record', () => {
  it('1: links exactly the approved public URL', () => {
    expect(voicedesk.url).toBe(APPROVED_URL)
  })

  it('2: shows exactly the approved domain', () => {
    expect(voicedesk.domain).toBe(APPROVED_DOMAIN)
  })

  it('3: is marked publicly accessible', () => {
    expect(voicedesk.publiclyAccessible).toBe(true)
  })

  it('4: uses the approved external link label', () => {
    expect(voicedesk.externalLinkLabel).toBe('View VoiceDesk')
  })

  it('5: uses the approved access note', () => {
    expect(voicedesk.accessNote).toBe('Public demonstration application.')
  })
})

describe('VoiceDesk assets', () => {
  it('6: points at the approved desktop asset', () => {
    expect(desktopAsset.src).toBe(DESKTOP_SRC)
  })

  it('7: declares 1280×800 for the desktop asset', () => {
    expect([desktopAsset.width, desktopAsset.height]).toEqual([DESKTOP_VISUAL_WIDTH, DESKTOP_VISUAL_HEIGHT])
    expect([desktopAsset.width, desktopAsset.height]).toEqual([1280, 800])
  })

  it('8: points at the approved mobile asset', () => {
    expect(mobileAsset.src).toBe(MOBILE_SRC)
  })

  it('9: declares 390×844 for the mobile asset', () => {
    expect([mobileAsset.width, mobileAsset.height]).toEqual([MOBILE_VISUAL_WIDTH, MOBILE_VISUAL_HEIGHT])
    expect([mobileAsset.width, mobileAsset.height]).toEqual([390, 844])
  })

  it('10: keeps the two asset paths distinct', () => {
    expect(desktopAsset.src).not.toBe(mobileAsset.src)
  })

  it('11: publishes sanitized responsive screenshots', () => {
    expect(visualType).toBe('sanitized-responsive-screenshots')
  })

  it('12: uses no branded fallback at either width', () => {
    expect(desktopAsset.kind).not.toBe('branded-fallback')
    expect(mobileAsset.kind).not.toBe('branded-fallback')
  })

  it('13: ships real WebP files at both widths', () => {
    for (const src of [DESKTOP_SRC, MOBILE_SRC]) {
      const file = bytes(join('public', src))
      expect(file.subarray(0, 4).toString('ascii'), src).toBe('RIFF')
      expect(file.subarray(8, 12).toString('ascii'), src).toBe('WEBP')
    }
  })

  it('14: keeps the desktop asset under 250 KB', () => {
    expect(bytes(join('public', DESKTOP_SRC)).length).toBeLessThan(250 * 1024)
  })

  it('15: keeps the mobile asset under 200 KB', () => {
    expect(bytes(join('public', MOBILE_SRC)).length).toBeLessThan(200 * 1024)
  })

  it('16: carries no EXIF block in either asset', () => {
    for (const src of [DESKTOP_SRC, MOBILE_SRC]) {
      expect(bytes(join('public', src)).includes(Buffer.from('EXIF', 'ascii')), src).toBe(false)
    }
  })

  it('17: carries no XMP block in either asset', () => {
    for (const src of [DESKTOP_SRC, MOBILE_SRC]) {
      const file = bytes(join('public', src))
      expect(file.includes(Buffer.from('XMP ', 'ascii')), src).toBe(false)
      expect(file.includes(Buffer.from('xmpmeta', 'ascii')), src).toBe(false)
    }
  })

  it('18: tracks no raw VoiceDesk capture', () => {
    expect(trackedFiles.filter((path) => /voicedesk.*\.(png|jpe?g|avif|tiff?|bmp)$/i.test(path))).toEqual([])
  })

  it('19: tracks no local capture path', () => {
    for (const path of shippedNonTestSources) {
      const source = read(path)
      expect(/[A-Z]:\\\\?Users\\/i.test(source), path).toBe(false)
      expect(source.includes('.playwright-mcp'), path).toBe(false)
    }
  })
})

describe('VoiceDesk art direction', () => {
  it('20: serves the desktop asset to desktop widths through the fallback img', () => {
    expect(imageSource.match(/<img/g) || []).toHaveLength(1)
    expect(imageSource).toContain('<img {...desktop} alt={alt} />')
  })

  it('21: serves the desktop asset to tablet widths', () => {
    expect(imageSource).toContain("MOBILE_VISUAL_MEDIA = '(max-width: 767px)'")
  })

  it('22: serves the mobile asset only below the phone breakpoint', () => {
    expect(imageSource).toMatch(/<source[^>]*media=\{MOBILE_VISUAL_MEDIA\}/)
    expect(imageSource.match(/<source/g) || []).toHaveLength(1)
  })

  it('23: never asks a desktop viewport for the mobile asset', () => {
    expect(imageSource).not.toContain('window.innerWidth')
    expect(imageSource).not.toContain('matchMedia')
  })

  it('24: never asks a phone viewport for the desktop asset outside the fallback', () => {
    expect(imageSource.match(/srcSet=\{/g) || []).toHaveLength(1)
    expect(imageSource).toMatch(/<source[\s\S]*srcSet=\{mobile\./)
  })

  it('25: renders one picture element, so only one asset downloads', () => {
    expect(imageSource.match(/<picture\s/g) || []).toHaveLength(1)
    expect(cardSource.match(/ResponsiveProjectImage/g) || []).toHaveLength(2)
  })
})

describe('VoiceDesk link behaviour', () => {
  it('26: renders exactly one external action per project card', () => {
    expect(cardSource.match(/<a /g) || []).toHaveLength(1)
  })

  it('27: sends that action to the approved public URL', () => {
    expect(cardSource).toContain('href={project.url}')
    expect(voicedesk.url).toBe(APPROVED_URL)
  })

  it('28: never prefetches the approved URL', () => {
    expect(cardSource).not.toContain('next/link')
    expect(cardSource).not.toContain('prefetch')
    for (const path of trackedSources) {
      const source = read(path)
      if (!source.includes(APPROVED_DOMAIN)) continue
      expect(/rel=["'{][^>]*(prefetch|preload|preconnect|dns-prefetch)/.test(source), path).toBe(false)
    }
  })

  it('29: embeds no iframe on the case-studies route', () => {
    for (const source of [cardSource, imageSource, pageSource, projectSource]) {
      expect(/<iframe/i.test(source)).toBe(false)
    }
  })

  it('30: serves VoiceDesk imagery from local CodeOutfitters assets', () => {
    expect(desktopAsset.src.startsWith('/images/selected-work/')).toBe(true)
    expect(mobileAsset.src.startsWith('/images/selected-work/')).toBe(true)
    expect(desktopAsset.src).not.toContain(APPROVED_DOMAIN)
    expect(mobileAsset.src).not.toContain(APPROVED_DOMAIN)
  })

  it('31: issues no automatic runtime request to the VoiceDesk host', () => {
    for (const path of shippedNonTestSources) {
      const source = read(path)
      if (!source.includes(APPROVED_DOMAIN)) continue
      expect(/(fetch|axios|XMLHttpRequest|new Image|createObjectURL)\s*\(/.test(source), path).toBe(false)
      expect(/src=\{?['"`][^'"`]*voicedesk-ebon/.test(source), path).toBe(false)
    }
  })

  it('32: reaches the VoiceDesk host only when a visitor activates the link', () => {
    // The host names the project record and nothing else that ships.
    const shippedReferences = shippedNonTestSources.filter((path) => read(path).includes(APPROVED_DOMAIN))
    expect(shippedReferences).toEqual(['lib/marketing/case-studies-projects.ts'])
    expect(
      /(router\.(push|replace)|location\.(href|assign|replace)|http-equiv=["']refresh)/.test(projectSource),
    ).toBe(false)
    expect(cardSource).toContain('target="_blank"')
    expect(cardSource).toContain('rel="noopener noreferrer"')
  })
})

describe('VoiceDesk change scope', () => {
  it('33: keeps VoiceDesk off the homepage', () => {
    for (const path of ['app/(public)/page.tsx', 'app/layout.tsx', 'app/sitemap.ts', 'app/robots.ts']) {
      if (!trackedFiles.includes(path)) continue
      expect(read(path).toLowerCase().includes('voicedesk'), path).toBe(false)
    }
  })

  it('34: leaves the other four projects unchanged', () => {
    expect(
      CASE_STUDY_PROJECTS.filter((entry) => entry.id !== 'voicedesk').map((entry) => [
        entry.id,
        entry.url,
        entry.visual?.desktop.src ?? null,
        entry.visual?.mobile?.src ?? null,
      ]),
    ).toEqual([
      ['sp-photo-station', 'https://spphotostation.com', '/images/selected-work/sp-photo-station-desktop.webp', '/images/selected-work/sp-photo-station-mobile.webp'],
      ['pro-photo-systems', 'https://www.prophotosystems.com', '/images/selected-work/pro-photo-systems-desktop.webp', '/images/selected-work/pro-photo-systems-mobile.webp'],
      ['endurance-pics', null, '/images/selected-work/endurance-pics.webp', null],
      ['damagemetric-ai', 'https://damagemetric.ai', '/images/selected-work/damagemetric-ai.webp', null],
    ])
  })

  it('35: leaves the homepage files unchanged since official production', () => {
    expect(changedSinceProduction.filter((path) => /^app\/\(public\)\/page\.tsx$/.test(path))).toEqual([])
  })

  it('36: leaves every other public route unchanged since official production', () => {
    const otherPublic = changedSinceProduction.filter(
      (path) => path.startsWith('app/(public)/') && !path.startsWith('app/(public)/case-studies/'),
    )
    expect(otherPublic).toEqual([])
  })

  it('37: leaves dashboard product source unchanged since official production', () => {
    const dashboardChanges = changedSinceProduction.filter((path) => path.startsWith('app/dashboard/'))
    // The only dashboard-owned file that moved is the origin guard that now
    // exempts the approved external VoiceDesk URL by exact string.
    expect(dashboardChanges).toEqual(['app/dashboard/interaction-identity-repair.test.ts'])
    expect(dashboardChanges.filter((path) => !/\.test\.tsx?$/.test(path))).toEqual([])
  })

  it('38: adds no migration', () => {
    expect(changedSinceProduction.filter((path) => path.includes('migrations/'))).toEqual([])
  })

  it('39: adds no AI implementation', () => {
    expect(/^\+.*(anthropic|openai|@ai-sdk|gpt-4|claude-)/im.test(diffSinceProduction)).toBe(false)
  })

  it('40: adds no Supabase implementation', () => {
    expect(/^\+.*@supabase\//im.test(diffSinceProduction)).toBe(false)
  })

  it('41: hardcodes no CodeOutfitters preview URL', () => {
    for (const path of shippedNonTestSources) {
      expect(/codeoutfitters-[a-z0-9]+-[a-z0-9-]*\.vercel\.app/i.test(read(path)), path).toBe(false)
    }
  })

  it('42: leaves the official canonical origin unchanged', () => {
    expect(CANONICAL_ORIGIN).toBe('https://codeoutfitters.vercel.app')
  })

  it('43: scans every non-test file the approved release shipped', () => {
    const released = git('diff', '--name-only', OFFICIAL_PRODUCTION_SHA, APPROVED_RELEASE_SHA)
      .split('\n')
      .filter(Boolean)
      .filter((path) => !/\.test\.tsx?$/.test(path))
    expect(released.filter((path) => !changedNonTestSinceProduction.includes(path))).toEqual([])
  })
})
