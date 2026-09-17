import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !serviceKey) {
  console.error(JSON.stringify({ ok: false, reason: "missing_server_supabase_configuration" }));
  process.exit(2);
}

const projectRef = new URL(url).hostname.split(".")[0] ?? null;
const boundedFetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("hosted_schema_probe_timeout")), 8_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: boundedFetch },
});

const checks = {};

function errorClass(error) {
  if (!error) return null;
  const message = String(error.message ?? "");
  if (/timeout|aborted|fetch failed|network/i.test(message) || !error.code) return "transport_unavailable";
  return error.code;
}

async function table(name, columns = "id") {
  const { error } = await supabase.from(name).select(columns).limit(0);
  checks[`table:${name}`] = error ? { ok: false, code: errorClass(error) } : { ok: true };
}

async function rpc(name, args) {
  const { error } = await supabase.rpc(name, args);
  const klass = errorClass(error);
  const missing = klass === "PGRST202" || /function .* could not be found/i.test(error?.message ?? "");
  const transport = klass === "transport_unavailable";
  checks[`rpc:${name}`] = missing || transport
    ? { ok: false, code: missing ? (error?.code || "missing") : klass }
    : { ok: true, invocation: error ? "reached_function_with_safe_rejection" : "completed" };
}

await table("workspaces");
await table("workspace_memberships");
await table("leads", "id,workspace_id,status,assigned_owner");
await table("tasks", "id,workspace_id");
await table("activity_events", "id,workspace_id,actor_kind");
await table("saved_views", "id,workspace_id");
await table("proposal_publications", "id,workspace_id,snapshot,status");
await table("proposal_access_links", "id,workspace_id,token_hash,decision");
await table("proposal_client_responses", "id,workspace_id,idempotency_key,response_type");
await table("integration_connections", "id,workspace_id,provider,status");
await table("oauth_states", "id,workspace_id");
await table("meetings", "id,workspace_id,connection_id");
await table("meeting_artifacts", "id,workspace_id,capture_source");
await table("transcripts", "id,workspace_id,state");
await table("transcript_entries", "id,workspace_id,provider_entry_id");
await table("ai_meeting_insights", "id,workspace_id");

const impossibleHash = "0".repeat(64);
await rpc("proposal_public_resolve", { p_token_hash: impossibleHash });
await rpc("proposal_public_record_open", { p_token_hash: impossibleHash });
await rpc("proposal_public_submit_response", {
  p_token_hash: impossibleHash,
  p_response_type: "comment",
  p_message: "schema probe",
  p_typed_name: "",
  p_authorized: false,
  p_idempotency_key: "schema-probe",
});
await rpc("change_lead_stage", {
  p_lead_id: "00000000-0000-0000-0000-000000000000",
  p_to_stage: "New",
  p_reason: null,
  p_change_source: "api",
  p_expected_from_stage: "New",
});
await rpc("reserve_slot", {
  p_date: "1970-01-01",
  p_time: "00:00",
  p_booking_data: {},
});

const failed = Object.entries(checks).filter(([, value]) => value.ok === false).map(([key]) => key);
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      projectRef,
      expectedProjectRef: "rsxdhwtprmuhzuocycxu",
      projectMatches: projectRef === "rsxdhwtprmuhzuocycxu",
      checks,
      failed,
    },
    null,
    2,
  ),
);
process.exitCode = failed.length === 0 && projectRef === "rsxdhwtprmuhzuocycxu" ? 0 : 1;
