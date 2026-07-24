// Canonical rail icons, transcribed verbatim from the canonical source:
// Dashboard/Command Center Final.dc.html lines 849-854 (T-01 tablet icon rail).
// The previous hand-drawn set was replaced: the canonical source defines its own
// icon system (24x24 viewBox, stroke 1.75, rect/path geometry, rendered at 18px)
// and approximations of it are not acceptable.
//
// Canonical defines exactly SIX rail icons. Nav destinations without one
// (Follow-ups, Email Activity, Team, Settings) are reachable through the
// expanded nav overlay (T-04) and the mobile drawer (MO-05), both of which are
// text-only in canonical. Do not invent a seventh icon to fill the gap.
import type { ReactElement, SVGProps } from "react";

export type NavIconKey = "overview" | "leads" | "pipeline" | "appointments" | "meetings" | "proposals";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
      {...props}
    />
  );
}

const PATHS: Record<NavIconKey, ReactElement> = {
  // CANON 849
  overview: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  // CANON 850
  leads: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  // CANON 851
  pipeline: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="10" rx="1.5" />
      <rect x="17" y="4" width="4" height="13" rx="1.5" />
    </>
  ),
  // CANON 852
  appointments: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  // CANON 853
  meetings: (
    <>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </>
  ),
  // CANON 854
  proposals: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
};

export function NavIcon({ icon, className }: { icon: NavIconKey; className?: string }) {
  return <Icon className={className}>{PATHS[icon]}</Icon>;
}
