// Pipeline screen — C-D06 (desktop), T-03 (tablet), MO-03 (mobile).
// Server component shell. Demo mode renders PipelineBoard (Opportunity fixtures, the
// demo store, drag/keyboard movement, every dialog — untouched). Live mode renders
// PipelineBoardLive (real Lead rows, moved via PATCH /api/leads/[id]) — a separate
// component, same split as app/dashboard/leads/[leadId]/lead-update-controls.tsx.
import { isDemoMode } from "@/lib/command-center/mode";
import { PipelineBoard } from "./pipeline-board";
import { PipelineBoardLive } from "./pipeline-board-live";

export default function PipelinePage() {
  return isDemoMode() ? <PipelineBoard /> : <PipelineBoardLive />;
}
