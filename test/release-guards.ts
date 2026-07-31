// Path scoping for the historical case-study release guards.
//
// `app/case-studies-official-baseline.test.ts` and
// `app/case-studies-voicedesk-visuals.test.ts` assert one thing about one pair of
// commits: what the approved `core-v1.1.0` case-study release did to the surface
// a visitor reaches, measured from the production baseline it shipped on top of.
// That is a statement about two immutable SHAs, so it has one answer forever, and
// the answer cannot change because a later branch added a file.
//
// The invariant is narrow and permanent: the release may not alter a file
// production already served, add a public route, add a rendered component, add a
// served asset, or add a migration. These helpers are the path half of that
// statement, kept pure so the guards can assert both sides of the boundary — the
// paths that are in scope and the paths that are not — without spawning a Git
// process per case, and so a hypothetical path can be checked without writing a
// decoy file into the repository.

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

/**
 * The protected paths in `changedPaths` that `approvedPaths` does not cover.
 *
 * The whole release-scope rule, as a function of its inputs rather than of the
 * repository's current state. The guards hand it the diff between two fixed
 * commits; a test can hand it a path that does not exist, which is how the rule
 * is proved to still bite without committing a decoy route or asset to prove it.
 */
export function unauthorizedReleasePaths(
  changedPaths: readonly string[],
  productionFiles: ReadonlySet<string>,
  approvedPaths: readonly string[],
): string[] {
  const approved = new Set(approvedPaths.map(normalizeRepoPath))
  return changedPaths
    .map(normalizeRepoPath)
    .filter((path) => isProtectedReleasePath(path, productionFiles))
    .filter((path) => !approved.has(path))
}
