import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DashboardContext } from "@/lib/dashboard/server";
import {
  type ProposalAccessLink,
  type ProposalClientResponse,
  type ProposalPublication,
  type ProposalPublicSnapshot,
} from "./model";
import { generateAccessToken, hashAccessToken } from "./token";

export type LivePublishInput = {
  title: string;
  clientOrganisation: string;
  versionLabel: string;
  netTerms: string;
  sections: Array<{ name: string; body: string }>;
};

export type LiveCreateLinkInput = {
  publicationId: string;
  recipientName: string;
  recipientEmail: string;
  expiresAt: string;
};

export type LiveProposalAccessState = {
  publications: ProposalPublication[];
  links: ProposalAccessLink[];
  responses: ProposalClientResponse[];
};

export function buildPublishedSnapshot(input: LivePublishInput): ProposalPublicSnapshot {
  return {
    title: input.title.trim(),
    clientOrganisation: input.clientOrganisation.trim(),
    versionLabel: input.versionLabel.trim(),
    netTerms: input.netTerms.trim(),
    currency: "USD",
    totalCents: null,
    sections: input.sections.map((section, index) => {
      const eyebrow = String(index + 1).padStart(2, "0");
      return {
        id: `section-${index + 1}`,
        navLabel: `${eyebrow} · ${section.name.trim()}`,
        blocks: [
          { kind: "heading" as const, eyebrow, title: section.name.trim() },
          ...(section.body.trim()
            ? [{ kind: "paragraph" as const, text: section.body.trim() }]
            : []),
        ],
      };
    }),
  };
}

function publicationFromRow(row: Record<string, unknown>): ProposalPublication {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    internalProposalId: row.internal_proposal_id as string,
    versionNumber: row.version_number as number,
    versionLabel: row.version_label as string,
    title: row.title as string,
    clientOrganisation: row.client_organisation as string,
    status: row.status as ProposalPublication["status"],
    publishedAt: row.published_at as string,
    publishedByUserId: (row.published_by as string | null) ?? "",
    publishedByLabel: (row.published_by_label as string) ?? "",
    supersededByPublicationId: (row.superseded_by as string | null) ?? null,
    snapshot: row.snapshot as ProposalPublicSnapshot,
  };
}

function linkFromRow(row: Record<string, unknown>): ProposalAccessLink {
  return {
    id: row.id as string,
    publicationId: row.publication_id as string,
    workspaceId: row.workspace_id as string,
    recipientName: row.recipient_name as string,
    recipientEmail: row.recipient_email as string,
    tokenHash: row.token_hash as string,
    demoToken: null,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    createdByUserId: (row.created_by as string | null) ?? "",
    revokedAt: (row.revoked_at as string | null) ?? null,
    revokedByUserId: (row.revoked_by as string | null) ?? null,
    firstOpenedAt: (row.first_opened_at as string | null) ?? null,
    lastOpenedAt: (row.last_opened_at as string | null) ?? null,
    openCount: Number(row.open_count ?? 0),
    decision: row.decision as ProposalAccessLink["decision"],
    decidedAt: (row.decided_at as string | null) ?? null,
    decidedByName: (row.decided_by_name as string | null) ?? null,
    replacesAccessLinkId: (row.replaces_link_id as string | null) ?? null,
    replacedByAccessLinkId: (row.replaced_by_link_id as string | null) ?? null,
  };
}

function responseFromRow(row: Record<string, unknown>): ProposalClientResponse {
  return {
    id: row.id as string,
    accessLinkId: row.access_link_id as string,
    publicationId: row.publication_id as string,
    workspaceId: row.workspace_id as string,
    responseType: row.response_type as ProposalClientResponse["responseType"],
    message: (row.message as string) ?? "",
    typedName: (row.typed_name as string) ?? "",
    authorizationConfirmed: Boolean(row.authorization_confirmed),
    idempotencyKey: row.idempotency_key as string,
    respondedAt: row.responded_at as string,
    createdAt: row.created_at as string,
  };
}

const PUBLICATION_COLUMNS =
  "id, workspace_id, internal_proposal_id, version_number, version_label, title, client_organisation, status, published_at, published_by, published_by_label, superseded_by, snapshot";
const LINK_COLUMNS =
  "id, publication_id, workspace_id, recipient_name, recipient_email, token_hash, expires_at, created_at, created_by, revoked_at, revoked_by, first_opened_at, last_opened_at, open_count, decision, decided_at, decided_by_name, replaces_link_id, replaced_by_link_id";
const RESPONSE_COLUMNS =
  "id, access_link_id, publication_id, workspace_id, response_type, message, typed_name, authorization_confirmed, idempotency_key, responded_at, created_at";

export async function listLiveProposalAccess(
  context: DashboardContext,
  internalProposalId: string,
): Promise<LiveProposalAccessState> {
  const supabase = await createClient();
  const { data: publicationRows, error: publicationError } = await supabase
    .from("proposal_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("workspace_id", context.workspaceId)
    .eq("internal_proposal_id", internalProposalId)
    .order("version_number", { ascending: false });
  if (publicationError) throw new Error("proposal_access_unavailable");

  const publications = (publicationRows ?? []).map((row) => publicationFromRow(row as Record<string, unknown>));
  const publicationIds = publications.map((publication) => publication.id);
  if (publicationIds.length === 0) return { publications, links: [], responses: [] };

  const [{ data: linkRows, error: linkError }, { data: responseRows, error: responseError }] = await Promise.all([
    supabase
      .from("proposal_access_links")
      .select(LINK_COLUMNS)
      .eq("workspace_id", context.workspaceId)
      .in("publication_id", publicationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("proposal_client_responses")
      .select(RESPONSE_COLUMNS)
      .eq("workspace_id", context.workspaceId)
      .in("publication_id", publicationIds)
      .order("responded_at", { ascending: false }),
  ]);
  if (linkError || responseError) throw new Error("proposal_access_unavailable");

  return {
    publications,
    links: (linkRows ?? []).map((row) => linkFromRow(row as Record<string, unknown>)),
    responses: (responseRows ?? []).map((row) => responseFromRow(row as Record<string, unknown>)),
  };
}

export async function publishLiveProposal(
  context: DashboardContext,
  internalProposalId: string,
  input: LivePublishInput,
): Promise<ProposalPublication> {
  const supabase = await createClient();
  const { data: latestRows, error: latestError } = await supabase
    .from("proposal_publications")
    .select("id, version_number")
    .eq("workspace_id", context.workspaceId)
    .eq("internal_proposal_id", internalProposalId)
    .order("version_number", { ascending: false })
    .limit(1);
  if (latestError) throw new Error("proposal_publish_unavailable");

  const nextVersion = Number(latestRows?.[0]?.version_number ?? 0) + 1;
  const snapshot = buildPublishedSnapshot(input);
  const { data: inserted, error: insertError } = await supabase
    .from("proposal_publications")
    .insert({
      workspace_id: context.workspaceId,
      internal_proposal_id: internalProposalId,
      version_number: nextVersion,
      version_label: input.versionLabel.trim(),
      title: input.title.trim(),
      client_organisation: input.clientOrganisation.trim(),
      published_by: context.userId,
      published_by_label: context.name,
      snapshot,
    })
    .select(PUBLICATION_COLUMNS)
    .single();
  if (insertError || !inserted) throw new Error("proposal_publish_unavailable");

  const publication = publicationFromRow(inserted as Record<string, unknown>);
  // Supersede older current versions. If this update fails, withdraw the newly inserted row so
  // the pre-existing current publication remains the only usable client version.
  const { error: supersedeError } = await supabase
    .from("proposal_publications")
    .update({ status: "superseded", superseded_by: publication.id })
    .eq("workspace_id", context.workspaceId)
    .eq("internal_proposal_id", internalProposalId)
    .eq("status", "published")
    .neq("id", publication.id);
  if (supersedeError) {
    await supabase
      .from("proposal_publications")
      .update({ status: "withdrawn" })
      .eq("workspace_id", context.workspaceId)
      .eq("id", publication.id);
    throw new Error("proposal_publish_unavailable");
  }
  return publication;
}

export async function createLiveProposalLink(
  context: DashboardContext,
  input: LiveCreateLinkInput,
): Promise<{ link: ProposalAccessLink; rawToken: string }> {
  const expiresAtMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    throw new Error("proposal_link_expiry_invalid");
  }

  const supabase = await createClient();
  const { data: publication, error: publicationError } = await supabase
    .from("proposal_publications")
    .select("id")
    .eq("workspace_id", context.workspaceId)
    .eq("id", input.publicationId)
    .eq("status", "published")
    .maybeSingle();
  if (publicationError || !publication) throw new Error("proposal_publication_not_available");

  const rawToken = generateAccessToken();
  const { data, error } = await supabase
    .from("proposal_access_links")
    .insert({
      publication_id: input.publicationId,
      workspace_id: context.workspaceId,
      recipient_name: input.recipientName.trim(),
      recipient_email: input.recipientEmail.trim().toLowerCase(),
      token_hash: hashAccessToken(rawToken),
      expires_at: new Date(expiresAtMs).toISOString(),
      created_by: context.userId,
    })
    .select(LINK_COLUMNS)
    .single();
  if (error || !data) throw new Error("proposal_link_unavailable");
  return { link: linkFromRow(data as Record<string, unknown>), rawToken };
}

export async function revokeLiveProposalLink(
  context: DashboardContext,
  accessLinkId: string,
): Promise<ProposalAccessLink> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposal_access_links")
    .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
    .eq("workspace_id", context.workspaceId)
    .eq("id", accessLinkId)
    .is("revoked_at", null)
    .select(LINK_COLUMNS)
    .maybeSingle();
  if (error || !data) throw new Error("proposal_link_not_available");
  return linkFromRow(data as Record<string, unknown>);
}
