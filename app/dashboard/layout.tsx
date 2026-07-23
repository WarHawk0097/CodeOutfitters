// SIDEBAR_SHELL per work/PHASED-IMPLEMENTATION-PLAN.md Phase 3. Route group so
// only authenticated app screens (Overview, Leads, ...) get the persistent nav —
// the root "/" placeholder and any future public/auth routes stay outside it.
// Server component: only the nested ShellNav/ShellHeaderBar need usePathname.
//
// Canonical frame behaviour (C-D01 32, C-D05 136, T-01 846, MO-01 1040): the
// application is a FIXED-HEIGHT frame — `height:1000px; display:flex;
// overflow:hidden` — with the rail at full height and the content column
// scrolling inside it. The page itself never grows past the viewport, so the
// scroll container is the inner region, not the document.
import type { ReactNode } from "react";
import { ShellNav, ShellHeaderBar, ShellMain } from "./shell-nav";
import { HeaderStatsProvider } from "./header-stats";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    // The provider spans header and content because the C-D05 header subtitle is derived
    // from the leads response the content fetches (see header-stats.tsx).
    <HeaderStatsProvider>
    <div className="flex h-screen overflow-hidden bg-cc-canvas">
      <ShellNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeaderBar />
        {/* Content padding is canonical per screen, so it lives in ShellMain where the
            pathname is available: Overview MO-01 1042 / T-01 859 / C-D01 44, Leads
            MO-02 1077 / T-02 894 / C-D05 143. */}
        <ShellMain>{children}</ShellMain>
      </div>
    </div>
    </HeaderStatsProvider>
  );
}
