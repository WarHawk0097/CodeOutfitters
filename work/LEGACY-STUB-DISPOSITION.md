# LEGACY STUB DISPOSITION
Covers: `app/admin`, `app/admin/onboarding`, `app/admin/proposal`, related historical dashboard/admin routes.

## Classification
LEGACY_NON_AUTHORITATIVE_STUBS

Not approved as visual or architectural foundation for Command Center. Overlap with Command Center scope is in *intent only* (client intake -> proposal), not in design authority, persistence, or code (see work/REPO-AUDIT.md: password-convenience-gated layout, localStorage-only state, different token palette, ~91 lines total).

## Rules (binding, effective immediately)
- Do not delete during Phase 0.
- Do not move during Phase 0.
- Do not redesign in place.
- Do not import into the new Command Center workspace.
- Do not use their visual styling.
- Do not use them as route authority.
- Do not use them as canonical component authority.
- Do not silently merge with the new workspace.

## Permitted inspection
May be inspected only for potentially reusable **non-visual** logic:
- utility functions
- validated schemas
- harmless domain constants
- test helpers
- provider-neutral business rules

## Reuse gate
Any reused logic requires a written reuse audit covering:
1. current purpose
2. dependencies
3. security assumptions
4. tenant assumptions
5. test coverage
6. compatibility with canonical contracts
7. reason for reuse
8. files copied
9. changes required

No direct cross-import of legacy stub code into `command-center/` is permitted under any circumstance. Approved reusable logic must be copied or reimplemented cleanly inside the new workspace, with tests and attribution recorded in the implementation report for the phase that reuses it.

## Disposition status
PRESERVE_UNTOUCHED_UNTIL_REPLACEMENT_IS_VERIFIED

After Command Center reaches approved parity with the stub's covered intent (client intake, proposal creation), a separate retirement proposal will be drafted identifying:
- obsolete routes
- obsolete components
- obsolete dependencies
- redirect requirements
- public frontend impact
- deletion risk
- rollback plan

No legacy deletion is authorized now or by this document.
