import { commandCenterClientConfig } from "@/lib/command-center/mode";
import { getDashboardContext } from "@/lib/dashboard/server";
import { SettingsScreen } from "./settings-view";

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default async function SettingsPage() {
  const config = commandCenterClientConfig();
  const viewer = config.live ? await getDashboardContext() : null;

  return (
    <SettingsScreen
      viewerName={viewer?.name}
      viewerRole={viewer ? roleLabel(viewer.role) : undefined}
    />
  );
}
