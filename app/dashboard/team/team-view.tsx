"use client";
// Team — the member directory, with search and role/status filters, invite, edit and remove.
//
// Everything writes to the local demo store. Inviting a member records a Pending row and marks
// it a demo invite — no invitation email is sent. Removing a member reassigns every record
// they owned to Unassigned, so no route is left pointing at a member who no longer exists.
import { useCallback, useMemo, useState } from "react";
import { inviteTeamMember, removeTeamMember, updateTeamMember } from "../../../lib/demo/actions";
import type { TeamMember, TeamRole, TeamStatus, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";

const ROLES: TeamRole[] = ["Administrator", "Sales"];
const STATUSES: TeamStatus[] = ["Active", "Pending", "Inactive"];
const STATUS_TONE: Record<TeamStatus, Tone> = { Active: "green", Pending: "amber", Inactive: "neutral" };

type TeamDraft = { name: string; email: string; role: TeamRole; status: TeamStatus };

export function TeamScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.team.filter((member) => {
      if (roleFilter && member.role !== roleFilter) return false;
      if (statusFilter && member.status !== statusFilter) return false;
      if (!needle) return true;
      return member.name.toLowerCase().includes(needle) || member.email.toLowerCase().includes(needle);
    });
  }, [state.team, q, roleFilter, statusFilter]);

  const filtersApplied = Boolean(q || roleFilter || statusFilter);
  const find = (id: string | null) => (id ? (state.team.find((m) => m.id === id) ?? null) : null);
  const editing = find(editId);
  const removing = find(removeId);

  // How many records a member owns — shown in the remove dialog so the reassignment is not a
  // surprise.
  const ownedCount = useCallback(
    (id: string) =>
      [state.opportunities, state.appointments, state.meetings, state.proposals, state.followUps].reduce(
        (sum, rows2) => sum + rows2.filter((r) => (r as { ownerId: string }).ownerId === id).length,
        0,
      ),
    [state],
  );

  if (status === "loading") return <RouteLoading label="team" />;
  if (status === "error") return <RouteError label="team" error={error!} onRetry={retry} />;

  const rowMenu: MenuItem[] = [
    { id: "edit", label: "Edit member" },
    { id: "remove", label: "Remove member", detail: "Reassigns owned records" },
  ];

  const renderRow = (member: TeamMember) => {
    const statusChip = (
      <span className="flex-shrink-0 font-cc-mono text-[9px] font-semibold tracking-[.05em]" style={{ color: TONE_INK[STATUS_TONE[member.status]] }}>
        {member.status.toUpperCase()}
      </span>
    );
    const avatar = (
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-cc-avatar text-[11px] font-semibold text-cc-avatar-ink">
        {member.initials}
      </span>
    );
    const menu = (
      <MenuButton
        label="⋯"
        ariaLabel={`Actions for ${member.name}`}
        align="right"
        width={220}
        items={rowMenu}
        onSelect={(id) => (id === "edit" ? setEditId(member.id) : setRemoveId(member.id))}
        className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
      />
    );

    if (breakpoint === "mobile") {
      return (
        <article key={member.id} aria-label={member.name} data-testid={`team-card-${member.id}`} className="mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px]">
          <div className="flex items-center gap-2.5">
            {avatar}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-cc-ink">{member.name}</div>
              <div className="truncate text-[10.5px] text-cc-t3">{member.email}</div>
            </div>
            {menu}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[10.5px] text-cc-t3">
            <span>{member.role}</span>
            {statusChip}
            <span>{member.lastActive}</span>
          </div>
        </article>
      );
    }

    return (
      <div key={member.id} data-testid={`team-row-${member.id}`} className="flex min-h-[58px] items-center gap-[13px] border-b border-cc-row-line px-4 py-2.5 last:border-b-0 xl:px-[18px]">
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-cc-ink">{member.name}</div>
          <div className="truncate text-[11.5px] text-cc-t3">{member.email}</div>
        </div>
        <span className="w-[110px] flex-shrink-0 text-[12px] text-cc-t2">{member.role}</span>
        <span className="w-[80px] flex-shrink-0">{statusChip}</span>
        <span className="w-[110px] flex-shrink-0 font-cc-mono text-[10.5px] text-cc-t3">{member.lastActive}</span>
        {menu}
      </div>
    );
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search team by name or email" />
        <FilterMenu label="Role" allLabel="All roles" value={roleFilter} options={ROLES.map((r) => ({ id: r, label: r }))} onChange={setRoleFilter} />
        <FilterMenu label="Status" allLabel="Any status" value={statusFilter} options={STATUSES.map((s) => ({ id: s, label: s }))} onChange={setStatusFilter} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setRoleFilter(null);
              setStatusFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="Invite member" tone="primary" onClick={() => setInviteOpen(true)} />
      </RouteToolbar>

      {rows.length === 0 ? (
        <RouteEmpty title="No team members to show" hint={filtersApplied ? "Clear a filter to see the rest." : "Invite someone to get started."} />
      ) : breakpoint === "mobile" ? (
        <>
          <p className="mb-2 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
            {rows.length} OF {state.team.length} MEMBERS
          </p>
          {rows.map(renderRow)}
        </>
      ) : (
        <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
          <div className="border-b border-cc-line bg-cc-secondary px-4 py-2 xl:px-[18px]">
            <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
              {rows.length} OF {state.team.length} MEMBERS
            </span>
          </div>
          {rows.map(renderRow)}
        </div>
      )}

      {editing ? (
        <TeamFormDialog
          title={`Edit ${editing.name}`}
          submitLabel="Save changes"
          initial={{ name: editing.name, email: editing.email, role: editing.role, status: editing.status }}
          showStatus
          onClose={() => setEditId(null)}
          onSubmit={(draft) => {
            updateTeamMember(editing.id, { name: draft.name.trim(), email: draft.email.trim(), role: draft.role, status: draft.status });
            setAnnouncement(`${draft.name.trim()} updated.`);
            setEditId(null);
          }}
        />
      ) : null}

      {inviteOpen ? (
        <TeamFormDialog
          title="Invite member"
          submitLabel="Send invite (demo)"
          initial={{ name: "", email: "", role: "Sales", status: "Pending" }}
          onClose={() => setInviteOpen(false)}
          onSubmit={(draft) => {
            inviteTeamMember(draft.name.trim(), draft.email.trim(), draft.role);
            setAnnouncement(`${draft.name.trim()} invited in demo mode — no invitation email was sent.`);
            setInviteOpen(false);
          }}
        />
      ) : null}

      {removing ? (
        <Dialog
          open
          title={`Remove ${removing.name}`}
          description="This reassigns every record they own to Unassigned. Recorded in the local demo store only."
          onClose={() => setRemoveId(null)}
          footer={
            <>
              <DialogCancelButton onClick={() => setRemoveId(null)} />
              <button
                type="button"
                onClick={() => {
                  removeTeamMember(removing.id);
                  setAnnouncement(`${removing.name} removed — owned records reassigned to Unassigned.`);
                  setRemoveId(null);
                }}
                className="rounded-cc-control bg-cc-red-ink px-3 py-1.5 text-[12.5px] font-semibold text-white"
              >
                Remove member
              </button>
            </>
          }
        >
          <p className="text-[12.5px] leading-[1.5] text-cc-t-table">
            {removing.name} owns {ownedCount(removing.id)} record{ownedCount(removing.id) === 1 ? "" : "s"} across the pipeline,
            appointments, meetings, proposals and follow-ups. Removing them reassigns each to Unassigned.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}

function TeamFormDialog({
  title,
  submitLabel,
  initial,
  showStatus,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial: TeamDraft;
  showStatus?: boolean;
  onClose: () => void;
  onSubmit: (draft: TeamDraft) => void;
}) {
  const [draft, setDraft] = useState<TeamDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof TeamDraft, string>>>({});
  const patch = (values: Partial<TeamDraft>) => setDraft((d) => ({ ...d, ...values }));
  return (
    <Dialog
      open
      title={title}
      description="Saved to the local demo store in this browser only."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label={submitLabel} form="team-form" />
        </>
      }
    >
      <form
        id="team-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateTeamDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSubmit(draft);
        }}
      >
        <TextField label="Name" value={draft.name} error={errors.name} onChange={(name) => patch({ name })} />
        <TextField label="Email" type="email" value={draft.email} error={errors.email} onChange={(email) => patch({ email })} />
        <SelectField label="Role" value={draft.role} onChange={(role) => patch({ role: role as TeamRole })} options={ROLES.map((r) => ({ value: r, label: r }))} />
        {showStatus ? (
          <SelectField label="Status" value={draft.status} onChange={(s) => patch({ status: s as TeamStatus })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        ) : null}
      </form>
    </Dialog>
  );
}

export function validateTeamDraft(draft: TeamDraft): Partial<Record<keyof TeamDraft, string>> {
  const errors: Partial<Record<keyof TeamDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Name is required.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) errors.email = "Enter a valid email.";
  return errors;
}
