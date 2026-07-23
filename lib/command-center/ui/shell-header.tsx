// The 56px application header, present at every breakpoint.
// Canonical: C-D01 40-43 (desktop), C-D05 143, T-01 858 / T-02 888 (tablet),
// MO-01 1041 / MO-02 1069 (mobile).
//
// Geometry is identical across frames — 56px tall, white, 1px #D9DFE2 bottom
// border — only the side padding and the right-hand slot change. Below md the
// header also carries the navigation trigger, because there is no rail there.
//
// The page title is the document h1 and lives here, not in the page body. At
// mobile, canonical puts a brand mark or a short title in the header centre
// instead (MO-01 shows "CodeOutfitters"; MO-02 shows "Leads"), so the centre and
// right slots are supplied by the caller.
"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { NavDrawer } from "./sidebar";

type LinkComponent = (props: { href: string; children: ReactNode; className?: string }) => ReactNode;

export type ShellHeaderProps = {
  activeHref: string;
  linkAs?: LinkComponent;
  title: string;
  /** ReactNode, not string: T-01 858 drops the trailing clause the desktop
      header (C-D01 41) carries, so callers pass a node with the tablet-hidden
      part marked up rather than two separate headers. */
  subtitle?: ReactNode;
  /** md and above, right-aligned (search / range switch / actions). */
  right?: ReactNode;
  /** Below md, header centre. Defaults to the canonical brand mark (MO-01). */
  mobileCenter?: ReactNode;
  /** Below md, right of the centre (MO-01 avatar, MO-02 record count). */
  mobileRight?: ReactNode;
};

export function ShellHeader({
  activeHref,
  linkAs,
  title,
  subtitle,
  right,
  mobileCenter,
  mobileRight,
}: ShellHeaderProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-cc-line bg-cc-surface px-4 md:px-5 xl:px-6">
        {/* MO-04: navigation trigger. 44px touch target per CANON 1037. */}
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center text-cc-ink focus-visible:outline-2 focus-visible:outline-cc-green md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <div className="hidden min-w-0 md:block">
          <h1 className="text-[15.5px] font-semibold text-cc-ink xl:text-[16px]">{title}</h1>
          {subtitle ? <div className="truncate text-[11px] text-cc-t3 xl:text-[11.5px]">{subtitle}</div> : null}
        </div>

        <div className="flex min-w-0 flex-1 justify-center md:hidden">
          {mobileCenter ?? (
            <span className="font-cc-sidebar text-[14.5px] text-cc-ink">
              Code<b>Outfitters</b>
            </span>
          )}
        </div>

        {right ? <div className="ml-auto hidden items-center gap-3 md:flex">{right}</div> : null}
        <div className="flex shrink-0 items-center md:hidden">{mobileRight}</div>
      </header>

      {open ? (
        <NavDrawer
          variant="mobile"
          className="md:hidden"
          activeHref={activeHref}
          linkAs={linkAs}
          onClose={() => setOpen(false)}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}
