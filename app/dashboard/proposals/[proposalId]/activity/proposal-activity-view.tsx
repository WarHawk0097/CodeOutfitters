"use client";
// A proposal's own history.
//
// What a proposal activity screen is FOR is answering "where did this get to, and who moved
// it" — drafted, reviewed, approved, blocked, and what state it sits in now. It is not a
// diff viewer: the demo stores a version label, not structured document content, so there is
// nothing to compare and a rendered "change summary" would be invented text with a
// confident layout around it.
//
// It also does not report client behaviour. Whether a client opened, accepted or declined
// this proposal is not observable until there is a secure client proposal route, so the
// screen says that instead of implying silence means nothing happened.
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { CLIENT_ACTIVITY_UNAVAILABLE, eventsFor } from "@/lib/activity/model";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { DEMO_TODAY } from "@/lib/demo/seed";
import { useDemoState } from "@/lib/demo/store";

// `live` arrives from the server page. COMMAND_CENTER_MODE is deliberately server-only and
// never NEXT_PUBLIC, so the browser is told which plane it is on rather than deciding.
export function ProposalActivityView({
  proposalId,
  live,
}: {
  proposalId: string;
  live: boolean;
}) {
  const state = useDemoState();

  const proposal = state.proposals.find((candidate) => candidate.id === proposalId) ?? null;
  const events = useMemo(
    () => eventsFor(state.activity, "proposal", proposalId),
    [state.activity, proposalId],
  );

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
          {proposalId}
          {proposal ? ` · ${proposal.client}` : ""}
        </h1>
        {proposal ? (
          <p className="mt-1 text-[12px] text-cc-t2">
            {proposal.service} · version {proposal.version} · {proposal.state}
          </p>
        ) : (
          <p className="mt-1 text-[12px] text-cc-t3">
            This proposal is not in the demo data. Its history is whatever has been recorded
            against this id.
          </p>
        )}
      </div>

      <ActivityPanel
        events={events}
        today={DEMO_TODAY}
        live={live}
        title="Proposal activity"
        emptyLabel="Nothing has been recorded against this proposal yet."
      />

      <p className="mt-4 rounded-cc-card border border-cc-line bg-cc-secondary p-3 text-[11.5px] leading-relaxed text-cc-t2">
        {CLIENT_ACTIVITY_UNAVAILABLE}
      </p>
    </div>
  );
}
