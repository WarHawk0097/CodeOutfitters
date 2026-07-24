// Demo-only mock worker bootstrap for the ported Command Center dashboard.
// Started exclusively from MockBrowserInit when the server-resolved mode is demo
// (see app/dashboard/layout.tsx); never in live mode. Registers only the leads
// plane — the sole /api/leads consumer the dashboard client islands have
// (lead-flow-chart + leads-data). All other requests bypass to the real routes.
import { setupWorker } from "msw/browser";
import { leadsHandlers } from "./handlers/leads";

export const worker = setupWorker(...leadsHandlers);
