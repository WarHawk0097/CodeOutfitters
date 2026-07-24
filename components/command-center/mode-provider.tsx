"use client";

// Command Center mode config, resolved SERVER-side (from the server-only
// COMMAND_CENTER_MODE) and handed to the client tree as props/context — never as
// a NEXT_PUBLIC env var, so the mode is never inlined into client bundles. Client
// components read booleans here to gate mode-dependent behaviour (e.g. real
// downloads), since they cannot and must not read the mode env directly.
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type CommandCenterConfig = {
  /** Live mode — the Work Order F data plane. Unset / demo resolves to false. */
  live: boolean;
  /** Real file downloads (CSV export, attachments) permitted. Demo => false. */
  downloadsEnabled: boolean;
};

const CommandCenterConfigContext = createContext<CommandCenterConfig>({
  live: false,
  downloadsEnabled: false,
});

export function CommandCenterConfigProvider({
  config,
  children,
}: {
  config: CommandCenterConfig;
  children: ReactNode;
}) {
  return (
    <CommandCenterConfigContext.Provider value={config}>
      {children}
    </CommandCenterConfigContext.Provider>
  );
}

export function useCommandCenterConfig(): CommandCenterConfig {
  return useContext(CommandCenterConfigContext);
}
