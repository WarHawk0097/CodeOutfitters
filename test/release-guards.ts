// Path scoping for the frozen case-study release guards.
//
// `app/case-studies-official-baseline.test.ts` and
// `app/case-studies-voicedesk-visuals.test.ts` freeze one thing: the surface the
// approved `core-v1.1.0` case-study release was allowed to touch. They compared
// the whole repository against the production baseline, so any later file — of
// any kind, in any directory — read as an unapproved change to the live site.
//
// The invariant they hold is narrower and permanent: the release may not alter a
// file production already served, add a public route, add a rendered component,
// add a served asset, or add a migration. These helpers are the path half of
// that statement, kept pure so the guards can assert both sides of the boundary
// without spawning a Git process per case.

/** Git speaks in `/`; a caller may hand us a path a Windows tool produced. */
export function normalizeRepoPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

/**
 * Directories whose contents reach a visitor. A file added under one of these is
 * public surface even though production never shipped it.
 */
const PUBLIC_SURFACE_PREFIXES = [
  'app/', // every route: marketing, login, dashboard, proposal, API
  'components/', // every component those routes render
  'public/', // every asset served from the origin
  'lib/marketing/', // the copy and project data the public routes render
  'lib/routing/', // the origins and links the public routes emit
] as const

/** Whether a path is part of the surface a visitor can reach or a migration. */
export function isPublicSurfacePath(path: string): boolean {
  const candidate = normalizeRepoPath(path)
  return (
    PUBLIC_SURFACE_PREFIXES.some((prefix) => candidate.startsWith(prefix)) ||
    candidate.split('/').includes('migrations')
  )
}

/**
 * Whether the release guards have to account for `path`.
 *
 * Two ways in: production already shipped the file, so any edit to it is an edit
 * to the live site; or the file is an addition to the public surface above.
 * Everything else is server-side work no visitor reaches, and the case-study
 * release guards make no claim about it.
 */
export function isProtectedReleasePath(
  path: string,
  productionFiles: ReadonlySet<string>,
): boolean {
  const candidate = normalizeRepoPath(path)
  return productionFiles.has(candidate) || isPublicSurfacePath(candidate)
}
