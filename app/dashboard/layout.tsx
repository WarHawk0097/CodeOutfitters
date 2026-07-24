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
import { CommandCenterConfigProvider } from "@/components/command-center/mode-provider";
import { commandCenterClientConfig } from "@/lib/command-center/mode";
import { MockBrowserInit } from "@/mocks/browser-init";

export default function ShellLayout({ children }: { children: ReactNode }) {
  // Mode is resolved here, in a server component, from the server-only
  // COMMAND_CENTER_MODE. The client tree receives only booleans (never the mode
  // env), so demo/live behaviour is server-decided and never inlined client-side.
  // Demo disables real downloads; live (Work Order F) permits them.
  const config = commandCenterClientConfig();
  return (
    // The provider spans header and content because the C-D05 header subtitle is derived
    // from the leads response the content fetches (see header-stats.tsx).
    <CommandCenterConfigProvider config={config}>
    {/* Demo serves the client islands' /api/leads plane through msw (see
        mocks/browser-init). Gated on the server-resolved mode: demo starts the
        worker, live never does. */}
    <MockBrowserInit enabled={!config.live}>
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
    </MockBrowserInit>
    </CommandCenterConfigProvider>
  );
}
