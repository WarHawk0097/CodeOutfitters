"use client";

// Live-mode-only "update" step of the lead detail workflow (goal section 9's
// ingest → list → open detail → update → ... chain). Only status and owner
// are writable — that is all supabase/migrations/20260812000000_leads_update.sql
// grants — so this control does not attempt to edit any other field. There is
// no demo-mode counterpart: demo status changes happen through the pipeline
// board's drag-and-drop (lib/demo/actions.ts's moveOpportunity), which this
// does not replace.
//
// Status and owner are two INDEPENDENT mutations, each with its own Save
// button, dirty flag, saving flag, and error state. They used to share one
// Save button and one PATCH body: a combined request could have
// change_lead_stage() succeed and the owner UPDATE fail afterward (or vice
// versa be blocked), leaving the API report a single "Save failed" that
// actually meant "half of what you asked for happened." Splitting the UI
// means the user performs two explicit operations, so partial success can
// never be misrepresented as one failed Save. The server enforces the same
// boundary — LeadsPatchRequestSchema rejects a request carrying both `status`
// and `owner` (lib/command-center/contracts/leads.ts) — so no future client
// can recreate the combined-request ambiguity even if this UI regresses.
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROW_ACTION_PRIMARY } from "@/lib/command-center/ui/control-system";
import { useLiveTasks } from "@/lib/tasks/use-live-tasks";
import { SelectField, TextField } from "@/components/demo/field";
import {
  CANONICAL_LEAD_STATUS_ORDER,
  LEAD_STATUS_LABELS,
  REASON_REQUIRED_STATUSES,
  type LeadStatus,
} from "@command-center/contracts";

export function LeadUpdateControls({
  leadId,
  currentStatus,
  currentOwner,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  currentOwner: string | null;
}) {
  const router = useRouter();
  const { team } = useLiveTasks();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [owner, setOwner] = useState(currentOwner ?? "");
  const [reason, setReason] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  // Re-syncs the dropdown to the server's real status after router.refresh() brings a
  // fresh `currentStatus` prop — the case that matters is a stage_conflict save (below):
  // it must show the true current status, not silently keep the user's stale selection.
  // Adjusted during render (React's documented pattern) rather than in an effect, so this
  // never causes an extra commit — see https://react.dev/learn/you-might-not-need-an-effect.
  // Owner needs no equivalent: it has no conflict path, so a successful owner save already
  // leaves `owner` equal to the refreshed `currentOwner` with no forced correction required.
  const [prevCurrentStatus, setPrevCurrentStatus] = useState(currentStatus);
  if (currentStatus !== prevCurrentStatus) {
    setPrevCurrentStatus(currentStatus);
    setStatus(currentStatus);
  }

  const statusOptions = useMemo(
    () => CANONICAL_LEAD_STATUS_ORDER.map((value) => ({ value, label: LEAD_STATUS_LABELS[value] })),
    [],
  );
  const ownerOptions = useMemo(() => team.map((m) => ({ value: m.id, label: m.name })), [team]);
  const statusDirty = status !== currentStatus;
  const ownerDirty = owner !== "" && owner !== currentOwner;
  const needsReason = REASON_REQUIRED_STATUSES.includes(status) && statusDirty;

  async function saveStatus() {
    if (needsReason && reason.trim() === "") {
      setStatusError("A reason is required for this status.");
      return;
    }
    if (!statusDirty) return;

    setStatusSaving(true);
    setStatusError("");
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status,
        expectedStatus: currentStatus,
        ...(reason.trim() !== "" ? { reason: reason.trim() } : {}),
      }),
    });
    const body = await res.json().catch(() => null);
    setStatusSaving(false);
    if (!res.ok) {
      if (body?.error?.code === "stage_conflict") {
        // Someone else changed this lead's stage first. Never resend the same stale
        // patch — reload the real status (the render-time check above re-syncs once the
        // refreshed `currentStatus` prop arrives) and make the user look again and
        // re-decide. Owner is untouched: this is the status mutation only.
        setStatusError("This lead's stage changed elsewhere — reloaded the current stage.");
        router.refresh();
        return;
      }
      setStatusError(body?.error?.message ?? "That stage update failed.");
      return;
    }
    setReason("");
    setAnnouncement("Lead stage updated.");
    router.refresh();
  }

  async function saveOwner() {
    if (!ownerDirty) return;

    setOwnerSaving(true);
    setOwnerError("");
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner }),
    });
    const body = await res.json().catch(() => null);
    setOwnerSaving(false);
    if (!res.ok) {
      setOwnerError(body?.error?.message ?? "That owner update failed.");
      return;
    }
    setAnnouncement("Lead owner updated.");
    router.refresh();
  }

  return (
    <div className="mb-8 rounded-cc-card border border-cc-line bg-cc-surface p-6">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cc-t3">Update</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <SelectField
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as LeadStatus)}
            options={statusOptions}
          />
          {needsReason ? (
            <TextField
              label="Reason"
              value={reason}
              onChange={setReason}
              required
              error={statusError && needsReason ? statusError : undefined}
            />
          ) : null}
          {statusError && !needsReason ? (
            <p className="mb-3 text-[11px] font-semibold text-cc-red-ink" role="alert">
              {statusError}
            </p>
          ) : null}
          <button
            type="button"
            className={ROW_ACTION_PRIMARY}
            disabled={!statusDirty || statusSaving || (needsReason && reason.trim() === "")}
            onClick={saveStatus}
          >
            {statusSaving ? "Saving…" : "Save stage"}
          </button>
        </div>
        <div>
          <SelectField
            label="Owner"
            value={owner}
            onChange={setOwner}
            options={[{ value: "", label: currentOwner ? "Keep current owner" : "Unassigned" }, ...ownerOptions]}
          />
          {ownerError ? (
            <p className="mb-3 text-[11px] font-semibold text-cc-red-ink" role="alert">
              {ownerError}
            </p>
          ) : null}
          <button
            type="button"
            className={ROW_ACTION_PRIMARY}
            disabled={!ownerDirty || ownerSaving}
            onClick={saveOwner}
          >
            {ownerSaving ? "Saving…" : "Save owner"}
          </button>
        </div>
      </div>
    </div>
  );
}
