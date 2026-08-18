// Shared active-conversation id between the floating Copilot drawer and the full
// /dashboard/ai page. Each mounts its own CopilotScreen with its own reducer — this
// module-level store is the only thing that ties their identity together, so opening a
// conversation on one surface and switching back to the other resumes it rather than
// showing whatever that surface last had. One browser tab, one active conversation, so a
// singleton is honest here, not a shortcut.
type Listener = () => void;

let activeId: string | null = null;
const listeners = new Set<Listener>();

export function getActiveConversationId(): string | null {
  return activeId;
}

export function setActiveConversationId(id: string | null): void {
  if (id === activeId) return;
  activeId = id;
  listeners.forEach((listener) => listener());
}

export function subscribeActiveConversationId(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
