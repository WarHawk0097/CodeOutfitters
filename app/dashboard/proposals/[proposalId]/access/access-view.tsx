"use client";
// Client Access: the internal side of secure proposals.
//
// This screen is where a proposal stops being an internal document and becomes something a
// person outside the company can read. Two things follow from that, and they shape everything
// below:
//
//   1. Publishing is a snapshot, not a pointer. Editing the proposal afterwards does not edit
//      what the client is looking at — publishing again supersedes it. A client should never
//      be told "the terms changed while you were reading them".
//
//   2. Access is per recipient. One link per person, revocable on its own, with its own open
//      count. A single shared link cannot be withdrawn from one reader, and cannot say who
//      actually opened it.
//
// In live mode this renders the contract and no data: there is no secure-proposal provider
// yet, so it says so rather than showing demo publications, which would put another
// workspace's client document on a real workspace's screen.
import Link from "next/link";
import { useId, useState } from "react";
import { ArrowLeft, Copy, Link2, Send, ShieldOff } from "lucide-react";
import { DEMO_NOW } from "@/lib/demo/seed";
import { useDemoState } from "@/lib/demo/store";
import {
  createProposalAccessLink,
  DEMO_LINK_DEFAULT_DAYS,
  publishProposal,
  revokeProposalAccessLink,
} from "@/lib/demo/actions";
import {
  demoLinkState,
  linksForProposal,
  proposalAccessPath,
  publicationsForProposal,
  responsesForProposal,
} from "@/lib/demo/proposal-access";
import {
  ACCESS_STATE_LABELS,
  CLIENT_RESPONSE_LABELS,
  NO_PUBLICATION_NOTICE,
  PUBLICATION_STATUS_LABELS,
  type ProposalAccessLink,
  type ProposalAccessState,
} from "@/lib/proposals/access/model";
import {
  resolveSecureProposalPlane,
  SECURE_PROPOSAL_PROVIDER_REQUIRED_REASON,
  SECURE_PROPOSAL_PROVIDER_REQUIRED_TITLE,
} from "@/lib/proposals/access/provider";
import { buildProposalDetail } from "@/lib/command-center/proposals/fixtures";

/** How a link's state reads at a glance. Colour is never the only carrier — the label says
 *  the state in words, so this is readable in monochrome and to a screen reader. */
const STATE_TONE: Record<ProposalAccessState, string> = {
  active: "border-cc-green-border bg-cc-green-tint text-cc-green-ink",
  accepted: "border-cc-green-border bg-cc-green-tint text-cc-green-ink",
  declined: "border-cc-line-strong bg-cc-soft text-cc-ink",
  expired: "border-cc-line-strong bg-cc-soft text-cc-t2",
  revoked: "border-cc-line-strong bg-cc-soft text-cc-t2",
  superseded: "border-cc-line-strong bg-cc-soft text-cc-t2",
  not_found: "border-cc-line bg-cc-secondary text-cc-t3",
};

function StateChip({ state }: { state: ProposalAccessState }) {
  return (
    <span className={`inline-block rounded-cc-control border px-2 py-0.5 text-[10.5px] font-medium ${STATE_TONE[state]}`}>
      {ACCESS_STATE_LABELS[state]}
    </span>
  );
}

function SecureProposalProviderRequired() {
  return (
    <div className="rounded-cc-card border border-cc-line bg-cc-secondary p-4">
      <h3 className="text-[13px] font-medium text-cc-ink">
        {SECURE_PROPOSAL_PROVIDER_REQUIRED_TITLE}
      </h3>
      <p className="mt-1 text-[11.5px] leading-relaxed text-cc-t2">
        {SECURE_PROPOSAL_PROVIDER_REQUIRED_REASON}
      </p>
    </div>
  );
}

export function ProposalAccessView({
  proposalId,
  live,
}: {
  proposalId: string;
  live: boolean;
}) {
  const state = useDemoState();
  const [notice, setNotice] = useState("");

  const proposal = state.proposals.find((candidate) => candidate.id === proposalId) ?? null;
  const publications = publicationsForProposal(state, proposalId);
  const links = linksForProposal(state, proposalId);
  const responses = responsesForProposal(state, proposalId);
  const current = publications.find((publication) => publication.status === "published") ?? null;
  const blockedReason = proposal ? buildProposalDetail(proposal).blockedReason : null;
  const blockedReasonId = useId();

  const plane = resolveSecureProposalPlane(live);

  return (
    <div className="cc-scope font-cc-body">
      <Link
        href="/dashboard/proposals"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to proposals
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-cc-ink-strong">
          Client access · {proposalId}
          {proposal ? ` · ${proposal.client}` : ""}
        </h1>
        {proposal ? (
          <p className="mt-1 text-[12px] text-cc-t2">
            {proposal.service} · version {proposal.version} · {proposal.state}
          </p>
        ) : null}
      </div>

      {plane.kind === "provider_required" ? (
        <SecureProposalProviderRequired />
      ) : !proposal ? (
        <p className="rounded-cc-card border border-cc-line bg-cc-secondary p-4 text-[12px] text-cc-t2">
          This proposal is not in the demo data, so there is nothing to publish.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
            <h2 className="text-[13px] font-semibold text-cc-ink">Published versions</h2>
            {publications.length === 0 ? (
              <p className="mt-2 text-[11.5px] leading-relaxed text-cc-t2">
                {NO_PUBLICATION_NOTICE}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {publications.map((publication) => (
                  <li
                    key={publication.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-cc-row-line pb-2 last:border-b-0"
                  >
                    <span className="text-[12px] font-medium text-cc-ink">
                      {publication.versionLabel} · {publication.snapshot.sections.length} sections
                    </span>
                    <span className="text-[11px] text-cc-t3">
                      {PUBLICATION_STATUS_LABELS[publication.status]} · published by{" "}
                      {publication.publishedByLabel}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {blockedReason ? (
              // Disabled AND explained. A disabled control with no reason is indistinguishable
              // from a broken one, and the reason is the validation's own words rather than a
              // generic failure — the person reading it is inside the workspace and is the one
              // who has to fix it.
              <div className="mt-4">
                <button
                  type="button"
                  disabled
                  aria-describedby={blockedReasonId}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-cc-control border border-cc-line bg-cc-secondary px-3 py-1.5 text-[12px] text-cc-t3"
                >
                  <Send className="h-3.5 w-3.5" />
                  Publish for client access
                </button>
                <p id={blockedReasonId} className="mt-2 text-[11.5px] leading-relaxed text-cc-t2">
                  {blockedReason}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const result = publishProposal(proposalId);
                  setNotice(
                    result.ok
                      ? "Published. Saved in browser — nothing was delivered to the client."
                      : result.reason,
                  );
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-cc-control border border-cc-line-strong bg-cc-soft px-3 py-1.5 text-[12px] font-medium text-cc-ink transition-colors hover:bg-cc-secondary"
              >
                <Send className="h-3.5 w-3.5" />
                {publications.length === 0 ? "Publish for client access" : "Publish current version"}
              </button>
            )}
          </section>

          {current ? (
            <NewLinkForm
              publicationId={current.id}
              onDone={(message) => setNotice(message)}
            />
          ) : null}

          <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
            <h2 className="text-[13px] font-semibold text-cc-ink">Access links</h2>
            {links.length === 0 ? (
              <p className="mt-2 text-[11.5px] text-cc-t2">
                No client has been given access to this proposal yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {links.map((link) => (
                  <LinkRow
                    key={link.id}
                    link={link}
                    linkState={demoLinkState(state, link, DEMO_NOW)}
                    onNotice={setNotice}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
            <h2 className="text-[13px] font-semibold text-cc-ink">Client responses</h2>
            {responses.length === 0 ? (
              <p className="mt-2 text-[11.5px] text-cc-t2">
                Nothing has come back from the client yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {responses.map((response) => (
                  <li key={response.id} className="border-l-2 border-cc-line pl-3">
                    <p className="text-[11px] text-cc-t3">
                      {CLIENT_RESPONSE_LABELS[response.responseType]}
                      {response.typedName ? ` · ${response.typedName}` : ""}
                    </p>
                    {response.message ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-cc-t2">
                        {response.message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <p className="mt-4 text-[11.5px] leading-relaxed text-cc-t2" role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}

function NewLinkForm({
  publicationId,
  onDone,
}: {
  publicationId: string;
  onDone: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(String(DEMO_LINK_DEFAULT_DAYS));
  const [error, setError] = useState("");

  return (
    <section className="rounded-cc-card border border-cc-line bg-cc-surface p-4">
      <h2 className="text-[13px] font-semibold text-cc-ink">Give a client access</h2>
      <p className="mt-1 text-[11.5px] leading-relaxed text-cc-t2">
        One link per person, so access can be withdrawn from one reader without withdrawing it
        from everybody. Nothing is emailed — copy the link and send it yourself.
      </p>
      <form
        className="mt-3 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const expiresInDays = Number(days);
          if (name.trim() === "" || email.trim() === "") {
            setError("Enter the recipient's name and email address.");
            return;
          }
          if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
            setError("Expiry must be a whole number of days between 1 and 365.");
            return;
          }
          setError("");
          const result = createProposalAccessLink({
            publicationId,
            recipientName: name,
            recipientEmail: email,
            expiresInDays,
          });
          if (!result.ok) {
            onDone(result.reason);
            return;
          }
          setName("");
          setEmail("");
          onDone("Access link created. Saved in browser — no email was sent.");
        }}
      >
        <label className="flex flex-col gap-1 text-[11px] text-cc-t3">
          Recipient name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-48 rounded-cc-control border border-cc-line bg-cc-secondary px-2 py-1.5 text-[12px] text-cc-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-cc-t3">
          Recipient email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-56 rounded-cc-control border border-cc-line bg-cc-secondary px-2 py-1.5 text-[12px] text-cc-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-cc-t3">
          Expires in (days)
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className="w-24 rounded-cc-control border border-cc-line bg-cc-secondary px-2 py-1.5 text-[12px] text-cc-ink"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-cc-control border border-cc-line-strong bg-cc-soft px-3 py-1.5 text-[12px] font-medium text-cc-ink transition-colors hover:bg-cc-secondary"
        >
          <Link2 className="h-3.5 w-3.5" />
          Create link
        </button>
      </form>
      {error ? <p className="mt-2 text-[11.5px] text-cc-danger">{error}</p> : null}
    </section>
  );
}

function LinkRow({
  link,
  linkState,
  onNotice,
}: {
  link: ProposalAccessLink;
  linkState: ProposalAccessState;
  onNotice: (message: string) => void;
}) {
  // Demo links carry a readable token because there is no secret behind them. A live link's
  // raw token is shown once at creation and never again — what is stored is a hash, so this
  // panel could not display it later even if somebody wanted it to.
  const token = link.demoToken;

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-b border-cc-row-line pb-3 last:border-b-0">
      <div>
        <p className="text-[12px] font-medium text-cc-ink">
          {link.recipientName} <StateChip state={linkState} />
        </p>
        <p className="mt-1 text-[11px] text-cc-t3">
          {link.openCount === 0
            ? "Not opened yet"
            : `Opened ${link.openCount} ${link.openCount === 1 ? "time" : "times"}`}
          {link.replacesAccessLinkId ? " · reissued" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {token ? (
          <button
            type="button"
            onClick={() => {
              // The origin comes from the browser, never from a constant: a hard-coded host
              // here would send a client to the wrong deployment.
              const url = `${window.location.origin}${proposalAccessPath(token)}`;
              void navigator.clipboard
                ?.writeText(url)
                .then(() => onNotice("Link copied to your clipboard."))
                .catch(() => onNotice(`Copy failed. The link is ${url}`));
            }}
            className="inline-flex items-center gap-1.5 rounded-cc-control border border-cc-line px-2 py-1 text-[11px] text-cc-t2 transition-colors hover:bg-cc-secondary"
          >
            <Copy className="h-3 w-3" />
            Copy link
          </button>
        ) : null}
        {link.revokedAt === null ? (
          <button
            type="button"
            onClick={() => {
              revokeProposalAccessLink(link.id);
              onNotice(`Access revoked for ${link.recipientName}. Saved in browser.`);
            }}
            className="inline-flex items-center gap-1.5 rounded-cc-control border border-cc-line px-2 py-1 text-[11px] text-cc-t2 transition-colors hover:bg-cc-secondary"
          >
            <ShieldOff className="h-3 w-3" />
            Revoke
          </button>
        ) : null}
      </div>
    </li>
  );
}
