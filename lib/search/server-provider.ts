import "server-only";

// Live SearchProvider — server-only. v1 scope is Leads and Tasks only: the two candidates that
// are both fully live (real table, real workspace_id, real detail/list route) and already have a
// plain-text set of fields worth matching on. Saved Views and AI Copilot are deliberately not
// indexed yet — see the work report for why — so adding either later means adding a fetch
// function here plus a new SearchEntityType in ./model, not touching this file's shape.
//
// Mirrors lib/tasks/server-provider.ts and lib/views/server-provider.ts: every query is
// workspace-scoped in the SQL itself as defense in depth, not the whole of the boundary (RLS is).
//
// Text matching happens in SQL (an `ilike` per token, ANDed across tokens, ORed across a record's
// searchable columns) so a query never pulls more than PER_ENTITY_ROWS rows per entity type out of
// the database. The existing deterministic ranking pipeline (searchDocuments/scoreDocument from
// ./model) then re-scores and orders that already-small, already-permission-scoped set, so live
// results are ranked identically to demo ones for the same query.
import { createClient } from "@/lib/supabase/server";
import {
  documentHref,
  scopeAdmits,
  searchDocuments,
  tokenize,
  normalizeQuery,
  MIN_QUERY_LENGTH,
  type CommandCenterSearchDocument,
  type SearchEntityType,
} from "./model";
import type { SearchProvider, SearchProviderQuery, SearchProviderPage } from "./provider";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MAX_LIMIT = 50;
const MAX_TOKENS = 5;
// ponytail: fixed per-entity row cap rather than a tuned value — revisit if a real workspace's
// results feel thin before the client-side limit is reached.
const PER_ENTITY_ROWS = 100;

function ilikeOr(columns: readonly string[], token: string): string {
  return columns.map((column) => `${column}.ilike.%${token}%`).join(",");
}

type LeadRow = {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  business_name: string | null;
  status: string | null;
  created_at: string;
};

const LEAD_TEXT_COLUMNS = ["first_name", "last_name", "work_email", "business_name"] as const;

async function fetchLeadDocuments(
  supabase: SupabaseServerClient,
  workspaceId: string,
  tokens: readonly string[],
): Promise<CommandCenterSearchDocument[]> {
  let request = supabase
    .from("leads")
    .select("id, first_name, last_name, work_email, business_name, status, created_at")
    .eq("workspace_id", workspaceId);
  for (const token of tokens.slice(0, MAX_TOKENS)) {
    request = request.or(ilikeOr(LEAD_TEXT_COLUMNS, token));
  }
  const { data, error } = await request.order("created_at", { ascending: false }).limit(PER_ENTITY_ROWS);
  if (error) throw error;
  return ((data ?? []) as LeadRow[]).map((row) => {
    const title = `${row.first_name} ${row.last_name}`.trim() || row.work_email;
    return {
      key: `lead:${row.id}`,
      type: "lead",
      id: row.id,
      title,
      subtitle: row.business_name ?? "",
      body: row.work_email ?? "",
      status: row.status ?? "",
      ownerLabel: "",
      timestampLabel: "",
      sortKey: row.created_at,
      href: documentHref("lead", row.id) ?? "/dashboard/leads",
    };
  });
}

type TaskRow = {
  id: string;
  title: string;
  detail: string;
  state: string;
  created_at: string;
};

const TASK_TEXT_COLUMNS = ["title", "detail"] as const;

async function fetchTaskDocuments(
  supabase: SupabaseServerClient,
  workspaceId: string,
  tokens: readonly string[],
): Promise<CommandCenterSearchDocument[]> {
  let request = supabase
    .from("tasks")
    .select("id, title, detail, state, created_at")
    .eq("workspace_id", workspaceId);
  for (const token of tokens.slice(0, MAX_TOKENS)) {
    request = request.or(ilikeOr(TASK_TEXT_COLUMNS, token));
  }
  const { data, error } = await request.order("created_at", { ascending: false }).limit(PER_ENTITY_ROWS);
  if (error) throw error;
  return ((data ?? []) as TaskRow[]).map((row) => ({
    key: `task:${row.id}`,
    type: "task",
    id: row.id,
    title: row.title,
    subtitle: row.detail ?? "",
    body: row.detail ?? "",
    status: row.state,
    ownerLabel: "",
    timestampLabel: "",
    sortKey: row.created_at,
    href: documentHref("task", row.id) ?? "/dashboard/my-work",
  }));
}

const EMPTY_PAGE: SearchProviderPage = { results: [], nextCursor: null };

export const serverSearchProvider: SearchProvider = {
  async search(query: SearchProviderQuery): Promise<SearchProviderPage> {
    const { workspaceId, text, scope, types, limit } = query;
    const tokens = tokenize(text);
    if (tokens.length === 0 || normalizeQuery(text).length < MIN_QUERY_LENGTH) return EMPTY_PAGE;

    const wants = (type: SearchEntityType) => (!types || types.includes(type)) && scopeAdmits(scope, type);
    const supabase = await createClient();
    const [leadDocs, taskDocs] = await Promise.all([
      wants("lead") ? fetchLeadDocuments(supabase, workspaceId, tokens) : Promise.resolve([]),
      wants("task") ? fetchTaskDocuments(supabase, workspaceId, tokens) : Promise.resolve([]),
    ]);

    const cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const results = searchDocuments([...leadDocs, ...taskDocs], { text, scope, limit: cappedLimit }, { types });
    return { results, nextCursor: null };
  },

  // No server-side "recently viewed" tracking exists yet — demo mode reads its recent list from
  // browser storage (see command-dialog.tsx), which has no live equivalent to read from.
  // ponytail: wire this up when the live command dialog is built; until then an empty page is the
  // honest answer, not a guess at what the caller last opened.
  async recent(): Promise<SearchProviderPage> {
    return EMPTY_PAGE;
  },
};
