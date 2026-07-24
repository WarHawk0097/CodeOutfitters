// Persistent nav shell, reconstructed against the canonical source.
// Route map: Dashboard/integration-layer/navigation.json. "forbidden" items
// (reference, extraction, viewport switcher, debug) are intentionally absent —
// do not add them.
//
// Canonical frames implemented here (Dashboard/Command Center Final.dc.html):
//   C-D01 33-38   desktop 248px aside: brand block, text-only rows, Collapse,
//                 account footer. Rows carry NO icons at this width.
//   T-01  847-856 tablet 72px icon rail: brand mark, six canonical icons,
//                 account avatar pinned to the bottom.
//   T-04  939-944 tablet expanded nav overlay, 248px, text-only, close + scrim.
//   MO-05 1109-1118 mobile drawer, 302px, same list, 44px close target.
// Row/label/badge styling comes from the canonical style builder at CANON
// 1319-1322; badge colours from the BC map at CANON 1313.
"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { NavIcon, type NavIconKey } from "./nav-icons";

export type NavItem = {
  label: string;
  href: string;
  // Only the six destinations the canonical rail defines an icon for carry one
  // (CANON 849-854). The rest are text-only everywhere, as in canonical.
  icon?: NavIconKey;
  badge?: string;
};
export type NavGroup = { label: string; items: NavItem[]; adminOnly?: boolean };

export const OPERATIONS_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "overview" },
  { label: "Leads", href: "/dashboard/leads", icon: "leads", badge: "12" },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: "pipeline" },
  { label: "Appointments", href: "/dashboard/appointments", icon: "appointments", badge: "3" },
  { label: "Meeting Intelligence", href: "/dashboard/meetings", icon: "meetings", badge: "2" },
  { label: "Proposals", href: "/dashboard/proposals", icon: "proposals", badge: "3" },
  { label: "Follow-ups", href: "/dashboard/follow-ups", badge: "4" },
  { label: "Email Activity", href: "/dashboard/email-activity", badge: "2" },
];

export const ADMINISTRATION_NAV: NavItem[] = [
  { label: "Team", href: "/dashboard/team" },
  { label: "Settings", href: "/dashboard/settings" },
];

export const NAV_GROUPS: NavGroup[] = [
  { label: "OPERATIONS", items: OPERATIONS_NAV },
  { label: "ADMINISTRATION", items: ADMINISTRATION_NAV, adminOnly: true },
];

// CANON 1313: const BC={'12':'#8FBF9B','3':'#6B6754','2':'#D98C7B','4':'#D9A94E'}
const BADGE_COLOR: Record<string, string> = { "12": "#8FBF9B", "3": "#6B6754", "2": "#D98C7B", "4": "#D9A94E" };

// CANON 1321 resolves the badge colour with one per-item exception: the
// Meeting Intelligence "2" is green, not the red-ish "2" Email Activity uses.
function badgeColor(item: NavItem): string {
  if (item.badge === "2" && item.label === "Meeting Intelligence") return "#8FBF9B";
  return (item.badge && BADGE_COLOR[item.badge]) || "#6B6754";
}

type LinkComponent = (props: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page";
}) => ReactNode;

const ROW_FOCUS = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cc-sidebar-rail";

// The canonical nav list: text-only rows, 37px tall, 26px side padding
// (CANON 1322). Identical in the desktop aside, the tablet overlay and the
// mobile drawer — canonical builds all three from one style function.
export function NavList({
  activeHref,
  linkAs: Link = "a" as unknown as LinkComponent,
}: {
  activeHref: string;
  linkAs?: LinkComponent;
}) {
  return (
    <div className="min-h-0 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-[26px] pt-[14px] pb-2 text-[10px] font-semibold tracking-[.16em] text-cc-sidebar-label">
            {group.label}
          </div>
          <ul>
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-[37px] items-center justify-between gap-2 px-[26px] text-[13.5px] ${ROW_FOCUS} ${
                      active
                        ? "font-medium text-cc-sidebar-active shadow-[inset_2px_0_0_var(--cc-sidebar-rail)]"
                        : "text-cc-sidebar-text hover:text-cc-sidebar-active"
                    }`}
                  >
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
                    {item.badge ? (
                      <span className="shrink-0 font-cc-sidebar-mono text-[11px]" style={{ color: badgeColor(item) }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// CANON 34 / 940 / 1112.
function BrandBlock() {
  return (
    <div>
      <div className="text-[16px] text-cc-sidebar-active">
        Code<b>Outfitters</b>
      </div>
      <div className="mt-1 text-[9.5px] tracking-[.22em] text-cc-sidebar-muted">COMMAND CENTER</div>
    </div>
  );
}

// CANON 37 / 942 / 1115. Name and role are canonical display values; there is no
// authentication in this phase, so nothing here is wired to a session.
function AccountFooter({
  avatar = 30,
  role = "Administrator",
  logout = false,
}: {
  avatar?: number;
  role?: string;
  logout?: boolean;
}) {
  return (
    <div className="flex items-center gap-[11px] border-t border-cc-sidebar-raised px-[26px] pt-[14px]">
      <div
        className="flex shrink-0 items-center justify-center rounded-[7px] bg-cc-avatar text-[11.5px] font-semibold text-cc-avatar-ink"
        style={{ width: avatar, height: avatar }}
      >
        MR
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-cc-sidebar-name">Marc Rivera</div>
        <div className="text-[10.5px] text-cc-sidebar-muted">{role}</div>
      </div>
      {logout ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B6754" strokeWidth={1.75} aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      ) : null}
    </div>
  );
}

// CANON 36. Presentational only: the canonical design shows a Collapse affordance
// but defines no collapsed desktop frame, so there is nothing to reconstruct
// behind it. Rendered non-interactive rather than as a button that does nothing.
function CollapseRow() {
  return (
    <div className="flex h-9 items-center gap-[11px] px-[26px] text-[12.5px] text-cc-sidebar-muted">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
      </svg>
      Collapse
    </div>
  );
}

// CANON 848 / 886: the rail's brand mark. Doubles as the trigger that opens the
// expanded nav overlay (T-04), which is how the four destinations without a
// canonical rail icon stay reachable at tablet width.
function RailMark({
  onOpen,
  expanded,
  buttonRef,
}: {
  onOpen: () => void;
  expanded: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      aria-label="Open navigation menu"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className={`mb-[14px] flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-cc-sidebar-raised ${ROW_FOCUS}`}
    >
      <span className="h-[10px] w-[10px] rounded-[3px] bg-cc-sidebar-mark" />
    </button>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// T-04 (tablet, 248px) and MO-05 (mobile, 302px) are the same overlay at two
// sizes. Canonical annotation at CANON 943/1116: "FOCUS TRAPPED · ESC CLOSES ·
// BODY SCROLL LOCKED · FOCUS RESTORED TO MENU TRIGGER" — all four below.
const DRAWER_VARIANTS = {
  tablet: {
    width: 248,
    scrim: "rgba(19,23,26,.34)",
    pad: "pt-6 pb-4",
    head: "px-[26px] pb-[22px]",
    close: 30,
    closeRadius: 7,
    role: "Administrator",
    avatar: 30,
  },
  mobile: {
    width: 302,
    scrim: "rgba(19,23,26,.46)",
    pad: "pt-[22px] pb-[14px]",
    head: "px-6 pb-[18px]",
    close: 44,
    closeRadius: 8,
    role: "Administrator · Sign out",
    avatar: 32,
  },
} as const;

export function NavDrawer({
  activeHref,
  linkAs,
  onClose,
  triggerRef,
  variant,
  className = "",
}: {
  activeHref: string;
  linkAs?: LinkComponent;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  variant: keyof typeof DRAWER_VARIANTS;
  className?: string;
}) {
  const v = DRAWER_VARIANTS[variant];
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock while open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Focus the close button on open; restore focus to the trigger on close.
  useEffect(() => {
    closeButtonRef.current?.focus();
    return () => {
      triggerRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc closes; Tab/Shift+Tab is trapped within the drawer.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Navigation menu" className={`fixed inset-0 z-50 ${className}`}>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
        style={{ background: v.scrim }}
      />
      <div
        ref={drawerRef}
        style={{ width: v.width }}
        className={`relative flex h-full flex-col overflow-hidden bg-cc-sidebar-ink font-cc-sidebar shadow-[24px_0_60px_rgba(19,23,26,.3)] ${v.pad}`}
      >
        <div className={`flex items-start justify-between ${v.head}`}>
          <BrandBlock />
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            style={{ width: v.close, height: v.close, borderRadius: v.closeRadius }}
            className="inline-flex shrink-0 items-center justify-center border-[1.5px] border-cc-sidebar-rail text-cc-sidebar-text shadow-[0_0_0_3px_rgba(92,155,108,.25)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <NavList activeHref={activeHref} linkAs={linkAs} />
        <div className="mt-auto pt-[14px]">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="mb-3 inline-flex items-center gap-2 rounded-md border border-cc-sidebar-rail px-3 py-2 text-[13px] font-medium text-cc-sidebar-text transition-colors hover:bg-cc-sidebar-raised focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cc-sidebar-text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
            View website
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <AccountFooter avatar={v.avatar} role={v.role} />
        </div>
      </div>
    </div>
  );
}

// C-D01 33-38: expanded 248px aside, xl (1280px) and above. Below xl the tablet
// rail takes over — Tailwind's md (768px) would wrongly expand at 820px, which
// is the canonical tablet width (Dashboard/docs/RESPONSIVE-SPEC.md).
function ExpandedSidebar({ activeHref, linkAs }: { activeHref: string; linkAs?: LinkComponent }) {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-[248px] shrink-0 flex-col self-stretch overflow-hidden bg-cc-sidebar-ink pt-6 pb-4 font-cc-sidebar xl:flex"
    >
      <div className="px-[26px] pb-6">
        <BrandBlock />
      </div>
      <NavList activeHref={activeHref} linkAs={linkAs} />
      <div className="mt-auto">
        {/* Persistent, clearly-labelled escape hatch back to the public site,
            sat with the account block where users look for site/account actions.
            mx-[26px] aligns its left edge with CollapseRow / AccountFooter. */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-[26px] mb-3 flex items-center gap-2 rounded-md border border-cc-sidebar-rail px-3 py-2 text-[13px] font-medium text-cc-sidebar-text transition-colors hover:bg-cc-sidebar-raised focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cc-sidebar-text"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          View website
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        <CollapseRow />
        <div className="mt-[10px]">
          <AccountFooter logout />
        </div>
      </div>
    </nav>
  );
}

// T-01 847-856: 72px icon rail, md (768px) to xl.
function IconRail({
  activeHref,
  linkAs: Link = "a" as unknown as LinkComponent,
  onOpen,
  open,
  triggerRef,
}: {
  activeHref: string;
  linkAs?: LinkComponent;
  onOpen: () => void;
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-[72px] shrink-0 flex-col items-center self-stretch overflow-hidden bg-cc-sidebar-ink pt-[22px] pb-4 font-cc-sidebar md:flex xl:hidden"
    >
      <RailMark onOpen={onOpen} expanded={open} buttonRef={triggerRef} />
      {OPERATIONS_NAV.map((item) =>
        item.icon ? (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={item.href === activeHref ? "page" : undefined}
            className={`flex h-10 w-11 items-center justify-center ${ROW_FOCUS} ${
              item.href === activeHref
                ? "text-cc-sidebar-active shadow-[inset_2px_0_0_var(--cc-sidebar-rail)]"
                : "text-cc-sidebar-text"
            }`}
          >
            <NavIcon icon={item.icon} />
          </Link>
        ) : null,
      )}
      <div className="mt-auto flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-cc-avatar text-[11px] font-semibold text-cc-avatar-ink">
        MR
      </div>
    </nav>
  );
}

// Below md there is no rail at all: mobile navigation is the header hamburger +
// MO-05 drawer (see ShellHeader).
export function Sidebar({ activeHref, linkAs }: { activeHref: string; linkAs?: LinkComponent }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <ExpandedSidebar activeHref={activeHref} linkAs={linkAs} />
      <IconRail
        activeHref={activeHref}
        linkAs={linkAs}
        open={open}
        onOpen={() => setOpen(true)}
        triggerRef={triggerRef}
      />
      {open ? (
        <NavDrawer
          variant="tablet"
          className="xl:hidden"
          activeHref={activeHref}
          linkAs={linkAs}
          onClose={() => setOpen(false)}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}
