"use client";

// Live-mode-only "update" step of the lead detail workflow (goal section 9's
// ingest → list → open detail → update → ... chain). Only status and owner
// are writable — that is all supabase/migrations/20260812000000_leads_update.sql
// grants — so this control does not attempt to edit any other field. There is
// no demo-mode counterpart: demo status changes happen through the pipeline
// board's drag-and-drop (lib/demo/actions.ts's moveOpportunity), which this
// does not replace.
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const statusOptions = useMemo(
    () => CANONICAL_LEAD_STATUS_ORDER.map((value) => ({ value, label: LEAD_STATUS_LABELS[value] })),
    [],
  );
  const ownerOptions = useMemo(() => team.map((m) => ({ value: m.id, label: m.name })), [team]);
  const needsReason = REASON_REQUIRED_STATUSES.includes(status) && status !== currentStatus;
  const dirty = status !== currentStatus || (owner !== "" && owner !== currentOwner);

  async function save() {
    if (needsReason && reason.trim() === "") {
      setError("A reason is required for this status.");
      return;
    }
    const patch: Record<string, string> = {};
    if (status !== currentStatus) patch.status = status;
    if (owner !== "" && owner !== currentOwner) patch.owner = owner;
    if (reason.trim() !== "") patch.reason = reason.trim();
    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    setError("");
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(body?.error?.message ?? "That update failed.");
      return;
    }
    setReason("");
    setAnnouncement("Lead updated.");
    router.refresh();
  }

  return (
    <div className="mb-8 rounded-cc-card border border-cc-line bg-cc-surface p-6">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cc-t3">Update</h2>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <SelectField
          label="Status"
          value={status}
          onChange={(value) => setStatus(value as LeadStatus)}
          options={statusOptions}
        />
        <SelectField
          label="Owner"
          value={owner}
          onChange={setOwner}
          options={[{ value: "", label: currentOwner ? "Keep current owner" : "Unassigned" }, ...ownerOptions]}
        />
      </div>
      {needsReason ? (
        <TextField label="Reason" value={reason} onChange={setReason} required error={error && needsReason ? error : undefined} />
      ) : null}
      {error && !needsReason ? <p className="mb-3 text-[11px] font-semibold text-cc-red-ink" role="alert">{error}</p> : null}
      <button type="button" className={ROW_ACTION_PRIMARY} disabled={!dirty || saving} onClick={save}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
