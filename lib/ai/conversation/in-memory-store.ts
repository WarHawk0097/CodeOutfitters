// An in-process `ConversationStore`.
//
// Non-durable and per-instance, for tests and local development. It exists so the
// orchestrator can be run end to end without the database change this task
// forbids; a persistent implementation replaces it behind the same interface.

import { ValidationError } from "../errors";
import { appendMessage } from "./state";
import type { Conversation, ConversationMessage, ConversationStore } from "./types";

export class InMemoryConversationStore implements ConversationStore {
  private readonly conversations = new Map<string, Conversation>();

  async create(conversation: Conversation): Promise<Conversation> {
    if (this.conversations.has(conversation.id)) {
      throw new ValidationError(`Conversation "${conversation.id}" already exists`);
    }
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async get(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  /**
   * Scoped by workspace *and* user.
   *
   * Both are required rather than optional: a listing that can be called without
   * a tenant is a listing that will eventually be called without one.
   */
  async list(workspaceId: string, userId: string, limit = 50): Promise<readonly Conversation[]> {
    return [...this.conversations.values()]
      .filter(
        (conversation) => conversation.workspaceId === workspaceId && conversation.userId === userId,
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  async append(id: string, message: ConversationMessage): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) throw new ValidationError(`No such conversation: "${id}"`);
    const updated = appendMessage(conversation, message);
    this.conversations.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }
}
