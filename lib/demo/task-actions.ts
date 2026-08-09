// Demo-plane TaskActions — thin adaptor over the synchronous lib/demo/actions writers so demo
// call sites can satisfy the same TaskActions contract the live hook satisfies.
import { completeTask, reassignTask, reopenTask, setTaskWaiting, updateTask } from "./actions";
import type { TaskActions } from "../tasks/actions";

export const demoTaskActions: TaskActions = {
  async updateTask(id, patch) {
    updateTask(id, patch);
    return { ok: true };
  },
  async completeTask(id) {
    completeTask(id);
    return { ok: true };
  },
  async reopenTask(id) {
    reopenTask(id);
    return { ok: true };
  },
  async setTaskWaiting(id, waitingOn) {
    if (waitingOn.trim() === "") return { ok: false, message: "Name who this is waiting on." };
    setTaskWaiting(id, waitingOn);
    return { ok: true };
  },
  async reassignTask(id, ownerId) {
    reassignTask(id, ownerId);
    return { ok: true };
  },
};
