"use client";

// Starts the msw browser worker when NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE=mock.
// Renders children only after the worker is ready (or immediately in real
// mode) so the first data fetch never races worker registration.
import { useEffect, useState, type ReactNode } from "react";

const MOCK_MODE = process.env.NEXT_PUBLIC_COMMAND_CENTER_DATA_MODE === "mock";

export function MockBrowserInit({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!MOCK_MODE);

  useEffect(() => {
    if (!MOCK_MODE) return;
    let cancelled = false;
    import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledRequest: "bypass" }).then(() => {
        if (!cancelled) setReady(true);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
