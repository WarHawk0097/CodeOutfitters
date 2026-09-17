import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ACCESS_STATE_DETAIL,
  ACCESS_STATE_HEADING,
  NOT_FOUND_VIEW,
  acceptsResponses,
  grantsContentAccess,
  isWellFormedAccessToken,
  type AccessDecision,
  type ClientResponseType,
  type ProposalAccessState,
  type ProposalPublicSnapshot,
  type ProposalPublicViewModel,
  type PublicResponseEcho,
} from "./model";
import { hashAccessToken } from "./token";
import type {
  ProposalPublicProvider,
  PublicResponseRejection,
  RecordOpenIntent,
  SubmitResponseIntent,
  SubmitResponseResult,
} from "./provider";

export type LiveResolvedRow = {
  link_id: string;
  recipient_name: string;
  expires_at: string;
  revoked_at: string | null;
  decision: AccessDecision;
  decided_at: string | null;
  decided_by_name: string | null;
  publication_status: "published" | "superseded" | "withdrawn";
  has_newer_version: boolean;
  version_label: string;
  title: string;
  client_organisation: string;
  snapshot: ProposalPublicSnapshot;
};

type ResponseRow = {
  id: string;
  response_type: ClientResponseType;
  message: string;
  typed_name: string;
  responded_at: string;
};

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("secure_proposal_not_configured");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function stateFor(row: LiveResolvedRow, now: string): ProposalAccessState {
  if (row.revoked_at !== null || row.publication_status === "withdrawn") return "revoked";
  if (row.decision === "accepted") return "accepted";
  if (row.decision === "declined") return "declined";
  if (row.publication_status === "superseded") return "superseded";
  if (now >= row.expires_at) return "expired";
  return "active";
}

function responseEchoes(rows: readonly ResponseRow[], recipientName: string): PublicResponseEcho[] {
  return rows
    .filter((row) => row.response_type === "question" || row.response_type === "comment")
    .map((row) => ({
      id: row.id,
      kind: row.response_type as "question" | "comment",
      message: row.message,
      displayName: row.typed_name || recipientName,
      submittedAt: row.responded_at,
    }));
}

export function resolvedRowToView(
  row: LiveResolvedRow | null,
  responses: readonly ResponseRow[],
  now: string,
): ProposalPublicViewModel {
  if (!row) return NOT_FOUND_VIEW;
  const state = stateFor(row, now);
  // Live links that are malformed/unknown/expired/revoked/withdrawn all collapse to the
  // same public shape. A client must not be able to use response wording to probe link state.
  if (state === "expired" || state === "revoked") return NOT_FOUND_VIEW;
  return {
    state,
    heading: ACCESS_STATE_HEADING[state],
    detail: ACCESS_STATE_DETAIL[state],
    document: grantsContentAccess(state) ? row.snapshot : null,
    recipientName: row.recipient_name,
    expiresAt: row.expires_at,
    decision:
      row.decision === "none"
        ? null
        : {
            kind: row.decision,
            at: row.decided_at ?? row.expires_at,
            typedName: row.decided_by_name,
          },
    newerVersionAvailable: row.has_newer_version || row.publication_status === "superseded",
    responses: responseEchoes(responses, row.recipient_name),
    canRespond: acceptsResponses(state),
  };
}

type ResolveMeta = {
  row: LiveResolvedRow | null;
  view: ProposalPublicViewModel;
};

export class LiveProposalPublicProvider implements ProposalPublicProvider {
  constructor(private readonly client: SupabaseClient = getServiceClient()) {}

  private async resolveMeta(rawToken: string): Promise<ResolveMeta> {
    if (!isWellFormedAccessToken(rawToken)) return { row: null, view: NOT_FOUND_VIEW };

    const tokenHash = hashAccessToken(rawToken);
    const { data, error } = await this.client.rpc("proposal_public_resolve", {
      p_token_hash: tokenHash,
    });
    if (error) throw new Error("secure_proposal_unavailable");

    const rows = (data ?? []) as LiveResolvedRow[];
    const row = rows[0] ?? null;
    if (!row) return { row: null, view: NOT_FOUND_VIEW };

    const { data: responseRows, error: responseError } = await this.client
      .from("proposal_client_responses")
      .select("id, response_type, message, typed_name, responded_at")
      .eq("access_link_id", row.link_id)
      .order("responded_at", { ascending: true });
    if (responseError) throw new Error("secure_proposal_unavailable");

    return {
      row,
      view: resolvedRowToView(row, (responseRows ?? []) as ResponseRow[], new Date().toISOString()),
    };
  }

  async resolve(rawToken: string): Promise<ProposalPublicViewModel> {
    return (await this.resolveMeta(rawToken)).view;
  }

  async recordOpen(intent: RecordOpenIntent): Promise<void> {
    if (!isWellFormedAccessToken(intent.rawToken)) return;
    const tokenHash = hashAccessToken(intent.rawToken);
    const { error } = await this.client.rpc("proposal_public_record_open", {
      p_token_hash: tokenHash,
    });
    if (error) throw new Error("secure_proposal_unavailable");
  }

  async submit(intent: SubmitResponseIntent): Promise<SubmitResponseResult> {
    if (!isWellFormedAccessToken(intent.rawToken)) {
      return { ok: false, reason: "not_available", view: NOT_FOUND_VIEW };
    }

    const before = await this.resolveMeta(intent.rawToken);
    if (!before.row) return { ok: false, reason: "not_available", view: before.view };

    // Idempotency is checked before the decision gate. A retried acceptance with the same key
    // therefore returns success even though the link is now in the accepted state.
    const { data: replay, error: replayError } = await this.client
      .from("proposal_client_responses")
      .select("id")
      .eq("access_link_id", before.row.link_id)
      .eq("idempotency_key", intent.idempotencyKey)
      .maybeSingle();
    if (replayError) return { ok: false, reason: "unavailable", view: before.view };
    if (replay) {
      return { ok: true, replay: true, view: (await this.resolveMeta(intent.rawToken)).view };
    }

    if (!before.view.canRespond) {
      const wanted: AccessDecision | null =
        intent.responseType === "acceptance"
          ? "accepted"
          : intent.responseType === "decline"
            ? "declined"
            : null;
      const reason: PublicResponseRejection =
        wanted && before.row.decision !== "none" && before.row.decision !== wanted
          ? "conflicting_decision"
          : "closed";
      return { ok: false, reason, view: before.view };
    }

    const tokenHash = hashAccessToken(intent.rawToken);
    const { data, error } = await this.client.rpc("proposal_public_submit_response", {
      p_token_hash: tokenHash,
      p_response_type: intent.responseType,
      p_message: intent.message,
      p_typed_name: intent.typedName,
      p_authorized: intent.authorizationConfirmed,
      p_idempotency_key: intent.idempotencyKey,
    });
    if (error) return { ok: false, reason: "unavailable", view: before.view };

    const after = await this.resolveMeta(intent.rawToken);
    if (data !== true) {
      const wanted: AccessDecision | null =
        intent.responseType === "acceptance"
          ? "accepted"
          : intent.responseType === "decline"
            ? "declined"
            : null;
      const reason: PublicResponseRejection =
        wanted && after.row?.decision !== "none" && after.row?.decision !== wanted
          ? "conflicting_decision"
          : "closed";
      return { ok: false, reason, view: after.view };
    }

    return { ok: true, replay: false, view: after.view };
  }
}
