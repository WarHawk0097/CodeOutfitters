// Pure workspace role hierarchy — mirrors the DB workspace_role enum and the
// workspace_role_rank() SQL helper so app-side checks agree with RLS.
export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type MembershipStatus = 'active' | 'invited' | 'suspended'

const RANK: Record<WorkspaceRole, number> = { owner: 3, admin: 2, member: 1 }

export function roleRank(role: WorkspaceRole): number {
  return RANK[role] ?? 0
}

export function hasMinRole(role: WorkspaceRole, min: WorkspaceRole): boolean {
  return roleRank(role) >= roleRank(min)
}
