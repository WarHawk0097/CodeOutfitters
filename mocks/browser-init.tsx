"use client";

// Starts the msw browser worker for the demo data plane. `enabled` is derived on
// the server from the server-only COMMAND_CENTER_MODE (demo => true, live =>
// false) and passed down as a boolean, so the mode env is never read on the
// client and the mock plane can never start in live mode. Children render only
// after the worker is ready (or immediately when disabled) so the first
// /api/leads fetch never races worker registration.
import { useEffect, useState, type ReactNode } from "react";

export function MockBrowserInit({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Dynamic import keeps msw out of the live bundle path: the chunk is only
    // fetched when the demo plane is enabled.
    import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledRequest: "bypass" }).then(() => {
        if (!cancelled) setReady(true);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!ready) return null;
  return <>{children}</>;
}
