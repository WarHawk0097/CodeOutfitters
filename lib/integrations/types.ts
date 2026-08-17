// The domain model Calendar and Email both extend. Mirrors
// supabase/migrations/20260818000000_integration_connections.sql exactly — a field
// here with no column there (or vice versa) is a bug, not a style choice.
//
// Nothing in this file may ever hold a credential value. That is the point of the
// split with provider.ts: this module is safe to import from a client component or a
// test fixture; provider.ts and crypto.ts are "server-only" and hold the parts that
// touch a real secret.

export type IntegrationProviderId = "local_test" | "google_calendar" | "gmail";

export type IntegrationConnectionStatus = "connected" | "disconnected" | "expired" | "error";

export type IntegrationConnectionEventType =
  | "connected"
  | "reconnected"
  | "refreshed"
  | "error"
  | "disconnected";

/** What a caller is ever allowed to see. No credential field exists on this type —
 *  not "omitted by convention", there is nowhere to put one. */
export type IntegrationConnection = {
  id: string;
  workspaceId: string;
  provider: IntegrationProviderId;
  status: IntegrationConnectionStatus;
  providerAccountId: string;
  providerAccountEmail: string | null;
  grantedScopes: readonly string[];
  connectedAt: string;
  refreshedAt: string | null;
  disconnectedAt: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationConnectionEvent = {
  id: string;
  connectionId: string;
  eventType: IntegrationConnectionEventType;
  detail: string | null;
  createdAt: string;
};
