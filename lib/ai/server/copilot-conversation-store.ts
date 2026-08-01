// The one place a persistent conversation store is constructed.
//
// Reading a history list must not drag the assistant in with it: the
// orchestrator's composition root builds a provider registry, a prompt registry,
// a tool registry and a rate limiter at module scope, none of which a `select`
// needs. This module is the seam both paths share instead — the orchestrator
// calls it for a turn, the history routes call it for a read, and neither one
// learns which database is behind it.
//
// Per request, never per process: the client is authenticated by the cookies of
// the request that asked, so a client held across requests would outlive the
// session that authorised it. RLS is the boundary, so there is no service-role
// key here and no scoping argument — see supabase/migrations/20260802000000_ai_conversations.sql.

import "server-only";
import { SupabaseConversationStore } from "@/lib/ai/conversation/supabase-store";
import type { ConversationStore } from "@/lib/ai/conversation/types";
import { createClient } from "@/lib/supabase/server";

/**
 * The conversation store for one request.
 *
 * Throws when the environment cannot produce a Supabase client. There is
 * deliberately no in-memory fallback: falling back would mean a deployment
 * quietly answering with an empty history instead of admitting it is broken.
 */
export async function createCopilotConversationStore(): Promise<ConversationStore> {
  return new SupabaseConversationStore(await createClient());
}
