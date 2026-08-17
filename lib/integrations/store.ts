import "server-only";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { decryptCredential, encryptCredential } from "./crypto";
import { getProviderAdapter } from "./registry";
import { IntegrationProviderError, type ProviderCredentials } from "./provider";
import type {
  IntegrationConnection,
  IntegrationConnectionEventType,
  IntegrationConnectionStatus,
  IntegrationProviderId,
} from "./types";

// The one place that reads or writes public.integration_connections. Mirrors
// lib/tasks/server-provider.ts: every query is workspace-scoped in the SQL itself as
// defense in depth, RLS (20260818000000_integration_connections.sql) is the boundary
// underneath, and no raw Postgres message ever reaches a caller.
//
// Two Supabase clients, deliberately:
//   - the session-bound `authenticated` client for everything that only touches safe
//     metadata (list, write a new/updated row, record an event) — RLS does the workspace
//     check, and the column-level grants in the migration make it physically incapable
//     of reading credential_ciphertext back, session or no session.
//   - a service-role client, used ONLY inside refresh()/disconnect(), for the one
//     operation that legitimately needs the encrypted credential: decrypting it to hand
//     to the provider adapter for a refresh or revoke call. It bypasses RLS, so both call
//     sites restate the workspace_id + id filter explicitly — the same "belt and
//     suspenders" pattern server-provider.ts uses for tasks.

export type IntegrationErrorCode = "invalid" | "forbidden" | "not_found" | "conflict" | "provider_error" | "unavailable";

export class IntegrationError extends Error {
  constructor(
    public readonly code: IntegrationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

const SAFE_COLUMNS =
  "id, workspace_id, provider, status, provider_account_id, provider_account_email, granted_scopes, connected_at, refreshed_at, disconnected_at, last_error, created_by, created_at, updated_at";

type ConnectionRow = {
  id: string;
  workspace_id: string;
  provider: IntegrationProviderId;
  status: IntegrationConnectionStatus;
  provider_account_id: string;
  provider_account_email: string | null;
  granted_scopes: string[];
  connected_at: string;
  refreshed_at: string | null;
  disconnected_at: string | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function toConnection(row: ConnectionRow): IntegrationConnection {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    status: row.status,
    providerAccountId: row.provider_account_id,
    providerAccountEmail: row.provider_account_email,
    grantedScopes: row.granted_scopes,
    connectedAt: row.connected_at,
    refreshedAt: row.refreshed_at,
    disconnectedAt: row.disconnected_at,
    lastError: row.last_error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Never a raw provider/Postgres message — capped, and adapters are documented to
 *  return only developer-authored, secret-free text in the first place. */
function toSafeErrorMessage(raw: string): string {
  return raw.length > 300 ? `${raw.slice(0, 297)}...` : raw;
}

function throwForPgError(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new IntegrationError("conflict", "That connection already exists.");
  if (error.code === "42501") throw new IntegrationError("forbidden", "You do not have permission to do that.");
  throw new IntegrationError("invalid", "That integration request could not be completed.");
}

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new IntegrationError("unavailable", "Integrations are not available.");
  return createServiceClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function recordEvent(
  connectionId: string,
  eventType: IntegrationConnectionEventType,
  detail?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_connection_events")
    .insert({ connection_id: connectionId, event_type: eventType, detail: detail ?? null });
  // Best-effort: a lost audit row must never fail the mutation that already
  // succeeded (or the disconnect that already cleared a credential).
  if (error) console.error("integration_connection_events insert failed", error.code);
}

export async function listConnections(workspaceId: string): Promise<IntegrationConnection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_connections")
    .select(SAFE_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("connected_at", { ascending: false });
  if (error) throwForPgError(error);
  return (data ?? []).map((row) => toConnection(row as ConnectionRow));
}

/**
 * Exchanges a provider connect code for a credential and stores the connection.
 * Deterministic on a repeat connect to the same (workspace, provider, account): the
 * unique constraint's upsert path reconnects the existing row rather than erroring or
 * creating a duplicate, and records a distinct 'reconnected' event so the audit trail
 * still shows it happened.
 */
export async function connect(
  workspaceId: string,
  provider: IntegrationProviderId,
  code: string,
): Promise<IntegrationConnection> {
  const adapter = await getProviderAdapter(provider);
  let exchange;
  try {
    exchange = await adapter.exchangeCode(code);
  } catch (error) {
    if (error instanceof IntegrationProviderError) {
      throw new IntegrationError("provider_error", toSafeErrorMessage(error.message));
    }
    throw new IntegrationError("provider_error", "The provider could not complete the connection.");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("integration_connections")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("provider_account_id", exchange.providerAccountId)
    .maybeSingle();

  const credentialCiphertext = encryptCredential(JSON.stringify(exchange.credentials));

  // Deliberately not a single upsert: the update grant on this table excludes
  // workspace_id/provider/provider_account_id/connected_at (see the migration —
  // connected_at is "first connected", immutable after that), so a reconnect must be a
  // narrower UPDATE than a first connect's INSERT, not the same payload either way.
  if (existing) {
    const { data, error } = await supabase
      .from("integration_connections")
      .update({
        status: "connected",
        provider_account_email: exchange.providerAccountEmail ?? null,
        granted_scopes: exchange.grantedScopes,
        credential_ciphertext: credentialCiphertext,
        credential_version: 1,
        refreshed_at: null,
        disconnected_at: null,
        last_error: null,
      })
      .eq("id", existing.id)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throwForPgError(error);
    await recordEvent(existing.id, "reconnected");
    return toConnection(data as ConnectionRow);
  }

  const { data, error } = await supabase
    .from("integration_connections")
    .insert({
      workspace_id: workspaceId,
      provider,
      status: "connected",
      provider_account_id: exchange.providerAccountId,
      provider_account_email: exchange.providerAccountEmail ?? null,
      granted_scopes: exchange.grantedScopes,
      credential_ciphertext: credentialCiphertext,
      credential_version: 1,
      connected_at: new Date().toISOString(),
    })
    .select(SAFE_COLUMNS)
    .single();
  if (error) throwForPgError(error);

  await recordEvent((data as ConnectionRow).id, "connected");
  return toConnection(data as ConnectionRow);
}

type ConnectionRowWithCredential = ConnectionRow & { credential_ciphertext: string | null };

async function loadForServiceOp(
  workspaceId: string,
  connectionId: string,
): Promise<{ client: SupabaseClient; row: ConnectionRowWithCredential }> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("integration_connections")
    .select(`${SAFE_COLUMNS}, credential_ciphertext`)
    .eq("workspace_id", workspaceId)
    .eq("id", connectionId)
    .maybeSingle();
  if (error) throwForPgError(error);
  if (!data) throw new IntegrationError("not_found", "That connection does not exist.");
  return { client, row: data as ConnectionRowWithCredential };
}

/** Trades the stored refresh credential for a new one via the provider adapter. */
export async function refreshConnection(workspaceId: string, connectionId: string): Promise<IntegrationConnection> {
  const { client, row } = await loadForServiceOp(workspaceId, connectionId);
  const ciphertext = (row as { credential_ciphertext: string | null }).credential_ciphertext;
  if (row.status === "disconnected" || !ciphertext) {
    throw new IntegrationError("conflict", "This connection is disconnected and cannot be refreshed.");
  }

  const adapter = await getProviderAdapter(row.provider);
  const credentials = JSON.parse(decryptCredential(ciphertext)) as ProviderCredentials;

  try {
    const result = await adapter.refresh(credentials);
    const { data, error } = await client
      .from("integration_connections")
      .update({
        status: "connected",
        credential_ciphertext: encryptCredential(JSON.stringify(result.credentials)),
        refreshed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", connectionId)
      .select(SAFE_COLUMNS)
      .single();
    if (error) throwForPgError(error);
    await recordEvent(connectionId, "refreshed");
    return toConnection(data as ConnectionRow);
  } catch (error) {
    const message =
      error instanceof IntegrationProviderError
        ? toSafeErrorMessage(error.message)
        : "The provider could not refresh this connection.";
    const { data, error: updateError } = await client
      .from("integration_connections")
      .update({ status: "error", last_error: message })
      .eq("workspace_id", workspaceId)
      .eq("id", connectionId)
      .select(SAFE_COLUMNS)
      .single();
    if (updateError) throwForPgError(updateError);
    await recordEvent(connectionId, "error", message);
    return toConnection(data as ConnectionRow);
  }
}

/**
 * Disconnects a connection. Best-effort revokes with the provider first, but local
 * state always moves to 'disconnected' and the credential is always cleared — a
 * provider outage must never leave a stale, still-decryptable refresh token behind.
 */
export async function disconnect(workspaceId: string, connectionId: string): Promise<IntegrationConnection> {
  const { client, row } = await loadForServiceOp(workspaceId, connectionId);
  const ciphertext = (row as { credential_ciphertext: string | null }).credential_ciphertext;

  if (row.status !== "disconnected" && ciphertext) {
    try {
      const adapter = await getProviderAdapter(row.provider);
      const credentials = JSON.parse(decryptCredential(ciphertext)) as ProviderCredentials;
      await adapter.revoke(credentials);
    } catch (error) {
      // Never surfaced to the caller and never blocks the local disconnect — see the
      // provider.ts revoke() contract note. Logged without the credential.
      console.error("provider revoke failed during disconnect", error instanceof Error ? error.message : error);
    }
  }

  const { data, error } = await client
    .from("integration_connections")
    .update({
      status: "disconnected",
      credential_ciphertext: null,
      disconnected_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", connectionId)
    .select(SAFE_COLUMNS)
    .single();
  if (error) throwForPgError(error);

  if (row.status !== "disconnected") await recordEvent(connectionId, "disconnected");
  return toConnection(data as ConnectionRow);
}
