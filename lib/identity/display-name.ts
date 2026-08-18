// Precedence for "who is this person" once a real session exists: an explicit
// application profile always wins (it is the one field the person or an admin
// chose deliberately), then whatever the OAuth provider verified, then a
// synthesized fallback that never renders blank. Pure and provider-agnostic so
// it can be unit tested without touching Supabase.

export type NameInputs = {
  profileFullName?: string | null
  providerFullName?: string | null
  providerGivenName?: string | null
  providerFamilyName?: string | null
  email?: string | null
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim()
}

export function resolveDisplayName(input: NameInputs): string {
  const profile = clean(input.profileFullName)
  if (profile) return profile

  const provider = clean(input.providerFullName)
  if (provider) return provider

  const given = clean(input.providerGivenName)
  const family = clean(input.providerFamilyName)
  if (given || family) return [given, family].filter(Boolean).join(' ')

  const email = clean(input.email)
  if (email) return email.split('@')[0]

  return 'Account'
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
