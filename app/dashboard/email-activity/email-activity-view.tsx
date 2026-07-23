"use client";
// Email Activity — the delivery log the canonical frame draws, with search, the direction
// and status filters, a thread/detail panel, read/unread and archive, a local compose and
// reply, and load-more paging.
//
// No provider is connected. Compose, reply and retry write a local record and mark it as a
// demo send — no message is delivered to any address, and no Gmail or other mailbox is read.
import { useCallback, useMemo, useState } from "react";
import { retryEmail, sendEmail, setEmailArchived, setEmailRead } from "../../../lib/demo/actions";
import { LEAD_DIRECTORY } from "../../../lib/demo/seed";
import type { EmailActivity, EmailState, Tone } from "../../../lib/demo/types";
import { useDemoQuery } from "../../../components/demo/use-demo-query";
import { TONE_INK } from "../../../components/demo/tone";
import { useBreakpoint } from "../../../components/demo/use-breakpoint";
import { MenuButton, type MenuItem } from "../../../components/demo/menu";
import { Dialog, DialogCancelButton, DialogSubmitButton } from "../../../components/demo/dialog";
import { SelectField, TextAreaField, TextField } from "../../../components/demo/field";
import { RouteEmpty, RouteError, RouteLoading } from "../../../components/demo/route-states";
import { FilterMenu, RouteToolbar, SearchInput, ToolbarButton } from "../../../components/demo/toolbar";

const STATE_TONE: Record<EmailState, Tone> = {
  QUEUED: "amber",
  SENT: "blue",
  DELIVERED: "blue",
  OPENED: "green",
  FAILED: "red",
  ARCHIVED: "neutral",
};

const STATES: EmailState[] = ["QUEUED", "SENT", "DELIVERED", "OPENED", "FAILED", "ARCHIVED"];
const DIRECTIONS = [
  { id: "outbound", label: "Outbound" },
  { id: "inbound", label: "Inbound" },
] as const;
const READ_OPTIONS = [
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
] as const;

const PAGE_SIZE = 4;

const SECONDARY_ACTION =
  "rounded-cc-control border border-cc-line-strong px-[11px] py-[5px] text-[11.5px] font-semibold text-cc-t-table hover:border-cc-green-border hover:text-cc-green-ink";

type ComposeDraft = { leadId: string; to: string; leadName: string; subject: string; body: string };

export function EmailActivityScreen() {
  const { state, status, error, retry } = useDemoQuery();
  const breakpoint = useBreakpoint();

  const [q, setQ] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [readFilter, setReadFilter] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [compose, setCompose] = useState<ComposeDraft | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.emails.filter((email) => {
      if (directionFilter && email.direction !== directionFilter) return false;
      if (stateFilter && email.state !== stateFilter) return false;
      if (readFilter === "read" && !email.read) return false;
      if (readFilter === "unread" && email.read) return false;
      if (!needle) return true;
      return (
        email.subject.toLowerCase().includes(needle) ||
        email.leadName.toLowerCase().includes(needle) ||
        email.to.toLowerCase().includes(needle) ||
        email.type.toLowerCase().includes(needle)
      );
    });
  }, [state.emails, q, directionFilter, stateFilter, readFilter]);

  const shown = rows.slice(0, visible);
  const filtersApplied = Boolean(q || directionFilter || stateFilter || readFilter);
  const unreadCount = useMemo(() => state.emails.filter((e) => !e.read && !e.archived).length, [state.emails]);
  const thread = threadId ? (state.emails.find((e) => e.id === threadId) ?? null) : null;

  const openThread = useCallback((email: EmailActivity) => {
    setThreadId(email.id);
    if (!email.read) setEmailRead(email.id, true);
  }, []);

  const startCompose = (email?: EmailActivity) => {
    if (email) {
      setCompose({
        leadId: email.leadId,
        to: email.to,
        leadName: email.leadName,
        subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
        body: "",
      });
    } else {
      const first = LEAD_DIRECTORY[0];
      setCompose({ leadId: first?.id ?? "", to: "", leadName: first?.name ?? "", subject: "", body: "" });
    }
  };

  if (status === "loading") return <RouteLoading label="email activity" />;
  if (status === "error") return <RouteError label="email activity" error={error!} onRetry={retry} />;

  const rowMenu = (email: EmailActivity): MenuItem[] => [
    { id: "open", label: "Open thread" },
    { id: "read", label: email.read ? "Mark unread" : "Mark read" },
    { id: "reply", label: "Reply (demo)" },
    { id: "retry", label: "Retry send", detail: "Demo — not delivered", disabled: email.state !== "FAILED" },
    { id: "archive", label: email.archived ? "Restore" : "Archive" },
  ];

  const onMenuSelect = (email: EmailActivity, id: string) => {
    if (id === "open") openThread(email);
    else if (id === "read") {
      setEmailRead(email.id, !email.read);
      setAnnouncement(`${email.subject} marked ${email.read ? "unread" : "read"}.`);
    } else if (id === "reply") startCompose(email);
    else if (id === "retry") {
      retryEmail(email.id);
      setAnnouncement(`${email.subject} queued for retry in demo mode — no email was delivered.`);
    } else if (id === "archive") {
      setEmailArchived(email.id, !email.archived);
      setAnnouncement(`${email.subject} ${email.archived ? "restored" : "archived"}.`);
    }
  };

  const renderRow = (email: EmailActivity) => {
    const chip = (
      <span
        className="flex-shrink-0 font-cc-mono text-[8px] font-semibold tracking-[.05em] xl:text-[9.5px]"
        style={{ color: TONE_INK[STATE_TONE[email.state]] }}
      >
        {email.state}
      </span>
    );
    const menu = (
      <MenuButton
        label="⋯"
        ariaLabel={`Actions for ${email.subject}`}
        align="right"
        width={240}
        items={rowMenu(email)}
        onSelect={(id) => onMenuSelect(email, id)}
        className="px-1 leading-none text-cc-icon-muted hover:text-cc-t2"
      />
    );
    const dirMark = email.direction === "inbound" ? "↓ In" : "↑ Out";

    if (breakpoint === "mobile") {
      return (
        <article
          key={email.id}
          aria-label={email.subject}
          data-testid={`email-card-${email.id}`}
          className={`mb-[9px] rounded-cc-card border border-cc-line bg-cc-surface px-[13px] py-[11px] ${email.read ? "" : "border-l-2 border-l-cc-green"}`}
        >
          <div className="flex justify-between gap-2">
            <button type="button" onClick={() => openThread(email)} className="min-w-0 truncate text-left text-[12.5px] font-semibold text-cc-ink">
              {email.subject}
            </button>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              {chip}
              {menu}
            </span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-cc-t3">
            {dirMark} · {email.leadName} · {email.to} · {email.sent}
          </div>
        </article>
      );
    }

    return (
      <div
        key={email.id}
        data-testid={`email-row-${email.id}`}
        className="flex min-h-[54px] items-center gap-[13px] border-b border-cc-row-line px-4 py-2.5 last:border-b-0 xl:px-[18px]"
      >
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${email.read ? "bg-transparent" : "bg-cc-green"}`} aria-hidden="true" />
        <span className="w-[54px] flex-shrink-0 font-cc-mono text-[10.5px] text-cc-t3">{dirMark}</span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => openThread(email)}
            className={`truncate text-left text-[13px] ${email.read ? "font-medium text-cc-t-table" : "font-semibold text-cc-ink"} hover:text-cc-green-ink`}
          >
            {email.subject}
          </button>
          <div className="mt-0.5 truncate text-[11.5px] text-cc-t3">
            {email.leadName} · {email.to} · {email.type}
          </div>
        </div>
        <span className="flex-shrink-0 font-cc-mono text-[10.5px] text-cc-t3">{email.sent}</span>
        {chip}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => openThread(email)} className={SECONDARY_ACTION}>
            Open
          </button>
          {menu}
        </div>
      </div>
    );
  };

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <RouteToolbar>
        <SearchInput value={q} onChange={setQ} label="Search email by subject, lead, recipient or type" />
        <FilterMenu
          label="Direction"
          allLabel="All directions"
          value={directionFilter}
          options={DIRECTIONS.map((d) => ({ id: d.id, label: d.label }))}
          onChange={setDirectionFilter}
        />
        <FilterMenu label="Status" allLabel="Any status" value={stateFilter} options={STATES.map((s) => ({ id: s, label: s }))} onChange={setStateFilter} />
        <FilterMenu label="Read" allLabel="Read & unread" value={readFilter} options={READ_OPTIONS.map((r) => ({ id: r.id, label: r.label }))} onChange={setReadFilter} />
        {filtersApplied ? (
          <ToolbarButton
            label="Clear filters"
            onClick={() => {
              setQ("");
              setDirectionFilter(null);
              setStateFilter(null);
              setReadFilter(null);
            }}
          />
        ) : null}
        <ToolbarButton label="Compose" tone="primary" onClick={() => startCompose()} />
      </RouteToolbar>

      {rows.length === 0 ? (
        <RouteEmpty
          title="No email activity to show"
          hint={filtersApplied ? "Clear a filter to see the rest." : "Compose a message to get started."}
        />
      ) : breakpoint === "mobile" ? (
        <>
          <p className="mb-2 font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
            {rows.length} MESSAGES · {unreadCount} UNREAD
          </p>
          {shown.map(renderRow)}
        </>
      ) : (
        <div className="overflow-hidden rounded-cc-card border border-cc-line bg-cc-surface">
          <div className="flex items-center justify-between border-b border-cc-line bg-cc-secondary px-4 py-2 xl:px-[18px]">
            <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">
              {rows.length} MESSAGES
            </span>
            <span className="font-cc-mono text-[10px] tracking-[.06em] text-cc-t3">{unreadCount} UNREAD</span>
          </div>
          {shown.map(renderRow)}
        </div>
      )}

      {visible < rows.length ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-4 py-2 text-[12px] font-semibold text-cc-t-table hover:border-cc-green-border hover:text-cc-green-ink"
          >
            Load more · {rows.length - visible} remaining
          </button>
        </div>
      ) : null}

      {thread ? (
        <EmailThreadDialog
          email={thread}
          onClose={() => setThreadId(null)}
          onToggleRead={() => {
            setEmailRead(thread.id, !thread.read);
            setAnnouncement(`${thread.subject} marked ${thread.read ? "unread" : "read"}.`);
          }}
          onArchive={() => {
            setEmailArchived(thread.id, !thread.archived);
            setAnnouncement(`${thread.subject} ${thread.archived ? "restored" : "archived"}.`);
            setThreadId(null);
          }}
          onReply={() => {
            const email = thread;
            setThreadId(null);
            startCompose(email);
          }}
        />
      ) : null}

      {compose ? (
        <ComposeDialog
          initial={compose}
          onClose={() => setCompose(null)}
          onSend={(draft) => {
            sendEmail({
              leadId: draft.leadId,
              to: draft.to.trim(),
              leadName: draft.leadName.trim(),
              type: "Manual send",
              subject: draft.subject.trim(),
              body: draft.body.trim(),
              direction: "outbound",
              state: "SENT",
              sent: "just now",
              read: true,
              archived: false,
            });
            setAnnouncement(`${draft.subject.trim()} recorded as sent in demo mode — no email was delivered.`);
            setCompose(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EmailThreadDialog({
  email,
  onClose,
  onToggleRead,
  onArchive,
  onReply,
}: {
  email: EmailActivity;
  onClose: () => void;
  onToggleRead: () => void;
  onArchive: () => void;
  onReply: () => void;
}) {
  return (
    <Dialog
      open
      title={email.subject}
      description={`${email.direction === "inbound" ? "From" : "To"} ${email.leadName} · ${email.to}`}
      onClose={onClose}
      width={560}
      footer={
        <>
          <DialogCancelButton onClick={onClose} label="Close" />
          <button type="button" onClick={onToggleRead} className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table">
            {email.read ? "Mark unread" : "Mark read"}
          </button>
          <button type="button" onClick={onArchive} className="rounded-cc-control border border-cc-line-strong bg-cc-surface px-3 py-1.5 text-[12.5px] font-semibold text-cc-t-table">
            {email.archived ? "Restore" : "Archive"}
          </button>
          <button type="button" onClick={onReply} className="rounded-cc-control bg-cc-green px-3 py-1.5 text-[12.5px] font-semibold text-white">
            Reply (demo)
          </button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11.5px] text-cc-t3">
        <span>Status · {email.state}</span>
        <span>Sent · {email.sent}</span>
        <span>{email.type}</span>
      </div>
      <p className="whitespace-pre-wrap rounded-cc-control bg-cc-soft px-3 py-3 text-[12.5px] leading-[1.6] text-cc-t-table">{email.body}</p>
    </Dialog>
  );
}

function ComposeDialog({
  initial,
  onClose,
  onSend,
}: {
  initial: ComposeDraft;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void;
}) {
  const leads = useMemo(() => LEAD_DIRECTORY.slice(0, 40), []);
  const [draft, setDraft] = useState<ComposeDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ComposeDraft, string>>>({});
  const patch = (values: Partial<ComposeDraft>) => setDraft((d) => ({ ...d, ...values }));
  return (
    <Dialog
      open
      title="Compose email"
      description="Recorded as a demo send in this browser only — no message is delivered to any address and no mailbox is connected."
      onClose={onClose}
      footer={
        <>
          <DialogCancelButton onClick={onClose} />
          <DialogSubmitButton label="Send (demo)" form="compose-form" />
        </>
      }
    >
      <form
        id="compose-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateComposeDraft(draft);
          setErrors(next);
          if (Object.keys(next).length === 0) onSend(draft);
        }}
      >
        <SelectField
          label="Lead"
          value={draft.leadId}
          onChange={(id) => {
            const lead = leads.find((row) => row.id === id);
            patch(lead ? { leadId: id, leadName: lead.name } : { leadId: id });
          }}
          options={leads.map((lead) => ({ value: lead.id, label: `${lead.name} — ${lead.company}` }))}
        />
        <TextField label="Recipient email" type="email" value={draft.to} error={errors.to} onChange={(to) => patch({ to })} />
        <TextField label="Subject" value={draft.subject} error={errors.subject} onChange={(subject) => patch({ subject })} />
        <TextAreaField label="Message" value={draft.body} error={errors.body} onChange={(body) => patch({ body })} rows={5} />
      </form>
    </Dialog>
  );
}

export function validateComposeDraft(draft: ComposeDraft): Partial<Record<keyof ComposeDraft, string>> {
  const errors: Partial<Record<keyof ComposeDraft, string>> = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.to.trim())) errors.to = "Enter a valid recipient email.";
  if (!draft.subject.trim()) errors.subject = "Subject is required.";
  if (!draft.body.trim()) errors.body = "Message is required.";
  return errors;
}
