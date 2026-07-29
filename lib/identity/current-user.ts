// The one place the signed-in person is named.
//
// Before this module the same human was spelled out independently in the sidebar
// account footer, the tablet drawer, the mobile drawer, the team seed, the settings
// profile fields and two proposal/transcript fixtures. Six copies of one identity is
// six chances to drift, and they had already drifted: the sidebar said one thing and
// the settings screen said another. Everything that displays "who is signed in" now
// reads from here.
//
// Demo identity, not an authentication record. There is no session in this phase —
// resolving the real user is the job of the auth work that comes later, and it will
// replace this constant rather than add a seventh copy beside it.

export const CURRENT_USER = {
  /** Matches the team member seeded in lib/demo/seed.ts (DEMO_CURRENT_USER_ID). */
  id: "user-002",
  name: "Marc Bryce",
  initials: "MB",
  email: "marc@gmail.com",
  /**
   * What the product calls this person on their own account surfaces.
   *
   * NOT a permission. The permission model keeps its own vocabulary — this user's
   * `TeamMember.role` is still the `TeamRole` value "Administrator", the Team
   * directory still lists and filters on that value, and every authority check still
   * compares against it. Renaming the enum would have changed what the user is
   * allowed to do; this changes only what they are called.
   */
  displayRole: "Owner",
} as const;

/**
 * The label to show for a member's role.
 *
 * Only the signed-in user gets the account-level display role; every other member is
 * described by their permission, because on the Team directory the role column IS the
 * permission model and must keep the same vocabulary as the Role filter beside it.
 */
export function displayRoleFor(userId: string, role: string): string {
  return userId === CURRENT_USER.id ? CURRENT_USER.displayRole : role;
}
