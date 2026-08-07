// Memory seams.
//
// Five distinct kinds of memory, because they differ in lifetime, in scope and in
// who may read them — collapsing them into one store is how a user's private note
// ends up in another user's context. Interfaces only, as this task specifies; the
// in-memory implementations exist to make the layers above runnable and testable,
// not to be the production store.
//
// Every read is scoped by an explicit key that carries workspace and, where
// relevant, user. No method takes an implicit ambient context.

/** Workspace-scoped keys. Present on every scope so a store can partition by tenant. */
export type WorkspaceScope = { workspaceId: string };
export type UserScope = WorkspaceScope & { userId: string };
export type SessionScope = UserScope & { sessionId: string };
export type ConversationScope = WorkspaceScope & { conversationId: string };

/**
 * A durable fact the assistant has learned or been told.
 *
 * `source` records where it came from so that model-inferred memories can be
 * distinguished from user-stated ones — they warrant different trust and
 * different retention.
 */
export type MemoryRecord = {
  id: string;
  text: string;
  source: "user" | "assistant" | "system";
  createdAt: string;
  /** Absent means no expiry. Enforced by the implementation, not the caller. */
  expiresAt?: string;
  metadata?: Readonly<Record<string, string>>;
};

/**
 * Rolling summary of one conversation.
 *
 * Separate from the conversation record because it is derived: it can be
 * regenerated, and losing it costs quality rather than data.
 */
export interface ConversationMemory {
  getSummary(scope: ConversationScope): Promise<string | undefined>;
  setSummary(scope: ConversationScope, summary: string): Promise<void>;
  clear(scope: ConversationScope): Promise<void>;
}

/** Short-lived scratch state for one sign-in. Expected to be evictable at any time. */
export interface SessionMemory {
  get(scope: SessionScope, key: string): Promise<string | undefined>;
  set(scope: SessionScope, key: string, value: string, ttlMs?: number): Promise<void>;
  clear(scope: SessionScope): Promise<void>;
}

/** Durable per-user facts. The store a future RAG index would sit beside, not inside. */
export interface LongTermMemory {
  remember(scope: UserScope, record: MemoryRecord): Promise<void>;
  recall(scope: UserScope, limit?: number): Promise<readonly MemoryRecord[]>;
  forget(scope: UserScope, id: string): Promise<void>;
}

/** Explicit user settings — tone, verbosity, default model. Never inferred silently. */
export interface UserPreferences {
  get(scope: UserScope): Promise<Readonly<Record<string, string>>>;
  set(scope: UserScope, preferences: Readonly<Record<string, string>>): Promise<void>;
}

/** Shared workspace context: glossary, conventions, standing constraints. */
export interface WorkspaceMemory {
  get(scope: WorkspaceScope): Promise<readonly MemoryRecord[]>;
  set(scope: WorkspaceScope, records: readonly MemoryRecord[]): Promise<void>;
}

/** The bundle the orchestrator receives. One dependency instead of five. */
export type MemorySystem = {
  conversation: ConversationMemory;
  session: SessionMemory;
  longTerm: LongTermMemory;
  preferences: UserPreferences;
  workspace: WorkspaceMemory;
};
