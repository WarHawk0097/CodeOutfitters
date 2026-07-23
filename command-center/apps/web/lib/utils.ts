// Minimal className joiner. We control the class strings passed to the UI primitives
// below, so we never need clsx/tailwind-merge conflict resolution here — a filter+join
// is enough. ponytail: upgrade to tailwind-merge only if a real class conflict appears.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
