"use client";
// Minimal Google connection card (Phase 2.5 — GOOGLE OAUTH FOUNDATION). Connect / Connected
// as <email> / Disconnect only. No Calendar or Gmail UI — those are explicitly out of scope
// until their own phases. Live fetch against the real integrations API, not the demo store:
// this is the one settings card with an actual server-side connection behind it.
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { BTN_DANGER, BTN_DISABLED, BTN_PRIMARY } from "@/lib/command-center/ui/control-system";
import { RouteError, RouteLoading } from "@/components/demo/route-states";

type Connection = {
  id: string;
  provider: string;
  status: "connected" | "error" | "disconnected";
  providerAccountEmail: string | null;
  grantedScopes: string[];
};

// Row wrapper shared by the connected Google state and the two Coming Soon
// providers, so all three read as one "Calendar connections" list.
function ProviderRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cc-line py-3 first:border-t-0 first:pt-0">
      {children}
    </div>
  );
}

const CALLBACK_DETAIL_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  invalid_request: "That authorization request was invalid.",
  invalid_state: "That authorization request expired or was already used.",
  session_mismatch: "Sign back in and try connecting again.",
  exchange_failed: "Google could not be connected. Try again.",
  provider_error: "Google reported an error. Try again.",
  not_available: "Integrations are not available.",
};

export function GoogleConnectionCard() {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumped to re-run the effect below (retry, post-connect/disconnect reload) — same
  // pattern as leads-data.tsx's `attempt`, so setState only ever happens inside the
  // effect's own .then/.catch, never synchronously in the effect body
  // (react-hooks/set-state-in-effect).
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/integrations/connections")
      .then((res) => {
        if (!active) return;
        // Demo-mode deployments 404 this route on purpose (see connect route's own
        // demo-mode gate) — no card, not an error, since there is nothing to connect.
        if (res.status === 404) {
          setStatus("unavailable");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().then((body: { connections: Connection[] }) => {
          if (!active) return;
          setConnection(body.connections.find((c) => c.provider === "google_calendar" && c.status === "connected") ?? null);
          setStatus("ready");
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "unknown error");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const reload = () => setReloadToken((n) => n + 1);

  // `capability` is incremental authorization against the SAME connection — the account
  // is never disconnected first, and the stored refresh token survives (see
  // lib/integrations/store.ts's connect()). Undefined means the plain identity connect.
  const connect = async (capability?: "meet") => {
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/integrations/connections/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "google_calendar", ...(capability ? { capability } : {}) }),
      });
      const body = (await res.json()) as { ok: boolean; authorizationUrl?: string };
      if (body.ok && body.authorizationUrl) {
        window.location.href = body.authorizationUrl;
        return;
      }
      setError("Google could not be connected. Try again.");
    } catch {
      setError("Google could not be connected. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!connection) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/integrations/connections/${connection.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      reload();
    } catch {
      setError("Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <RouteLoading label="Google connection" />;
  if (status === "unavailable") return null;
  if (status === "error") return <RouteError label="Google connection" error={error!} onRetry={reload} />;

  const callbackStatus = searchParams.get("google");
  const callbackDetail = searchParams.get("google_detail");
  const banner =
    callbackStatus === "error"
      ? (callbackDetail && CALLBACK_DETAIL_MESSAGES[callbackDetail]) || "Google could not be connected."
      : null;

  // Scope names are safe metadata (never a token), returned by listConnections()'s
  // fixed safe-column select — see the route's own comment. Only openid/email/profile
  // are ever requested today (lib/integrations/providers/google.ts), so the accurate
  // label is always "account connected", never "Calendar syncing" — but this stays
  // scope-driven rather than hardcoded so the label stays honest if Calendar scopes
  // are ever added later, without anyone having to remember to update this string.
  const hasCalendarScope = connection?.grantedScopes.some((s) => s.toLowerCase().includes("calendar")) ?? false;
  // Same rule for Meet, and it is the ONLY thing that decides what this card claims:
  // granted_scopes is what Google actually returned, not what was requested. A consent
  // screen that has not been updated yet simply does not grant it, and the card says
  // "permission required" rather than implying transcripts will appear.
  const hasMeetScope =
    connection?.grantedScopes.includes("https://www.googleapis.com/auth/meetings.space.readonly") ?? false;

  return (
    <section
      id="settings-google"
      aria-labelledby="settings-google-title"
      className="scroll-mt-4 rounded-cc-card border border-cc-line bg-cc-surface p-4 xl:p-5"
    >
      <div className="mb-3">
        <h2 id="settings-google-title" className="text-[14px] font-semibold text-cc-ink">
          Calendar connections
        </h2>
        <p className="mt-0.5 text-[12px] text-cc-t3">
          One Google account identifies you here. Each permission below is listed separately and reflects what
          Google actually granted — nothing is read until its permission says granted.
        </p>
      </div>

      {banner ? (
        <p role="alert" className="mb-3 text-[12px] text-cc-red-ink">
          {banner}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 text-[12px] text-cc-red-ink">
          {error}
        </p>
      ) : null}

      <ProviderRow>
        <div className="text-[12.5px] text-cc-ink">
          <span className="font-semibold">Google Calendar</span>
          {connection ? (
            <span className="ml-2 text-cc-t3">
              {hasCalendarScope ? "Google Calendar connected" : "Google account connected"} as{" "}
              <span className="font-semibold text-cc-ink">{connection.providerAccountEmail ?? "unknown email"}</span>
              {hasCalendarScope ? null : " — Calendar sync is not enabled yet."}
            </span>
          ) : null}
        </div>
        {connection ? (
          <button type="button" onClick={disconnect} disabled={busy} className={busy ? BTN_DISABLED : BTN_DANGER}>
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={() => connect()} disabled={busy} className={busy ? BTN_DISABLED : BTN_PRIMARY}>
            Connect Google
          </button>
        )}
      </ProviderRow>

      {/* Per-permission truth for the one connection that exists. Each line is derived
          from granted_scopes, so none of them can claim a capability Google did not
          actually grant. */}
      {connection ? (
        <ProviderRow>
          <ul className="space-y-1 text-[12px] text-cc-t3">
            <li data-permission="account">Account identity — granted.</li>
            <li data-permission="calendar">
              Calendar — {hasCalendarScope ? "granted." : "permission required. Calendar is not read or written."}
            </li>
            <li data-permission="meet">
              Google Meet — {hasMeetScope ? "granted." : "permission required."}
            </li>
            <li data-permission="transcript">
              Meeting transcripts —{" "}
              {hasMeetScope
                ? "available for meetings your Workspace transcribed. Meet keeps transcript entries for 30 days after a meeting."
                : "unavailable until the Google Meet permission is granted."}
            </li>
          </ul>
        </ProviderRow>
      ) : null}

      <ProviderRow>
        <div className="text-[12.5px] text-cc-ink">
          <span className="font-semibold">Apple Calendar (iCloud)</span>
          <span className="ml-2 text-cc-t3">Not connected.</span>
        </div>
        <span className="rounded-cc-control bg-cc-secondary px-2 py-1 text-[11px] font-semibold text-cc-t3">
          Coming soon
        </span>
      </ProviderRow>

      <ProviderRow>
        <div className="text-[12.5px] text-cc-ink">
          <span className="font-semibold">Microsoft Outlook / Microsoft 365</span>
          <span className="ml-2 text-cc-t3">Not connected.</span>
        </div>
        <span className="rounded-cc-control bg-cc-secondary px-2 py-1 text-[11px] font-semibold text-cc-t3">
          Coming soon
        </span>
      </ProviderRow>

      {/* Meeting providers are a separate list from calendar connections because they
          answer a different question: which conversations can this workspace read a
          transcript from. Google Meet's state is the same connection above — one Google
          identity, not a second sign-in. */}
      <div id="settings-meeting-providers" className="mt-5 border-t border-cc-line pt-4">
        <h3 className="text-[13px] font-semibold text-cc-ink">Meeting providers</h3>
        <p className="mb-2 mt-0.5 text-[12px] text-cc-t3">
          Transcripts are read only from meetings your own account can already access.
        </p>

        <ProviderRow>
          <div className="text-[12.5px] text-cc-ink">
            <span className="font-semibold">Google Meet</span>
            <span className="ml-2 text-cc-t3">
              {!connection
                ? "Connect the Google account first."
                : hasMeetScope
                  ? "Permission granted. Transcripts can be read for meetings your Workspace transcribed."
                  : "Permission required."}
            </span>
          </div>
          {connection && !hasMeetScope ? (
            <button
              type="button"
              onClick={() => connect("meet")}
              disabled={busy}
              className={busy ? BTN_DISABLED : BTN_PRIMARY}
            >
              Grant Meet permission
            </button>
          ) : null}
        </ProviderRow>

        <ProviderRow>
          <div className="text-[12.5px] text-cc-ink">
            <span className="font-semibold">Zoom</span>
            <span className="ml-2 text-cc-t3">Not connected.</span>
          </div>
          <span className="rounded-cc-control bg-cc-secondary px-2 py-1 text-[11px] font-semibold text-cc-t3">
            Coming soon
          </span>
        </ProviderRow>

        <ProviderRow>
          <div className="text-[12.5px] text-cc-ink">
            <span className="font-semibold">Microsoft Teams</span>
            <span className="ml-2 text-cc-t3">Not connected.</span>
          </div>
          <span className="rounded-cc-control bg-cc-secondary px-2 py-1 text-[11px] font-semibold text-cc-t3">
            Coming soon
          </span>
        </ProviderRow>
      </div>
    </section>
  );
}
