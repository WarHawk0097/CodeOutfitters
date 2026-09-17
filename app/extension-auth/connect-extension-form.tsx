"use client";

import { useState } from "react";

export function ConnectExtensionForm({ requestId, state, codeChallenge }: { requestId: string; state: string; codeChallenge: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/extension/auth/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, state, codeChallenge }) });
      if (!response.ok) throw new Error("The authorization request expired. Start sign-in again from the extension.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect extension.");
      setBusy(false);
    }
  }
  return <div className="mt-7"><button type="button" onClick={connect} disabled={busy} className="w-full rounded-xl bg-[#1C1612] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Connecting…" : "Connect extension"}</button>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</div>;
}
