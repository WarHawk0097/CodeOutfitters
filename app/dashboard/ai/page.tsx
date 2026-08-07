// Copilot. The screen is entirely client-side state — a draft, a transcript and one
// in-flight request — so the page is just the mount point.
//
// No auth check here on purpose: `/dashboard` is already covered by middleware.ts
// and the dashboard layout, and a second check inside the page would be a second
// place for the rule to drift. Nothing about the session is read here either, so
// there is no identity to hand down as a prop; the endpoint resolves the user from
// the request itself.
import { CopilotScreen } from "./copilot-view";

export const metadata = { title: "Copilot — Command Center" };

export default function CopilotPage() {
  return <CopilotScreen />;
}
