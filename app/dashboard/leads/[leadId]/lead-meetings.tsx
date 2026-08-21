// Lead 360 — Meetings, Transcripts and Meeting Intelligence for one Lead.
//
// A server component, not a client island: everything here is workspace data read under
// the caller's own session, so there is no reason to ship it to the browser and re-fetch
// it. Demo mode never renders this at all (the page gates on `live`), because there is no
// meeting plane in demo and a fixture meeting here would be indistinguishable from a real
// one.
//
// The honesty rules the whole screen turns on:
//   - Every meeting shows its real sync status. "No transcript" and "permission required"
//     are different states with different fixes and are never collapsed.
//   - Every AI line shows CONFIRMED / INFERRED and cites the transcript entries it came
//     from. A line with no evidence and no confidence does not get rendered.
//   - UNKNOWN is not rendered as an empty value; it is simply absent, and a section with
//     nothing in it says so.
import Link from "next/link";
import { Confidence, FieldLine, FieldList, hasValue } from "@/components/meetings/insight-fields";
import { listMeetings } from "@/lib/meetings/store";
import { getPreMeetingBrief, type BriefItem } from "@/lib/meetings/ai/brief";
import { MeetingIntelligenceSchema, PresentationIntelligenceSchema } from "@/lib/meetings/ai/schema";
import { getLatestInsights } from "@/lib/meetings/ai/store";
import { MEETING_STATUS_LABEL } from "@/lib/meetings/status-label";

function BriefList({ label, items }: { label: string; items: readonly BriefItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] uppercase tracking-wide text-cc-t4">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-[12.5px] text-cc-ink">
            {item.value}
            <Confidence value={item.confidence} />
            <span className="ml-2 text-[10px] text-cc-t4">from {item.meetingTitle ?? "an earlier meeting"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function LeadMeetings({ workspaceId, leadId }: { workspaceId: string; leadId: string }) {
  const meetings = await listMeetings(workspaceId, leadId);
  const brief = await getPreMeetingBrief(workspaceId, leadId);

  const insightsByMeeting = await Promise.all(
    meetings.map(async (meeting) => ({ meeting, insights: await getLatestInsights(workspaceId, meeting.id) })),
  );

  return (
    <section aria-labelledby="lead-meetings-heading" className="mb-8" data-testid="lead-meetings">
      <h2
        id="lead-meetings-heading"
        className="mb-4 text-xs font-semibold uppercase tracking-wide text-cc-t3"
      >
        Meetings
      </h2>

      {/* Pre-meeting brief. Composed from earlier analysed meetings plus CRM state — no
          model runs here, so it can only ever repeat something already grounded. */}
      <div className="mb-4 rounded-cc-card border border-cc-line bg-cc-surface p-5" data-testid="lead-premeeting-brief">
        <p className="text-[13px] font-semibold text-cc-ink">Before the next meeting</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
          {brief.dealState.map((entry) => (
            <div key={entry.label}>
              <dt className="text-[10px] uppercase tracking-wide text-cc-t4">{entry.label}</dt>
              <dd className="text-[12.5px] text-cc-ink">{entry.value ?? "Not recorded"}</dd>
            </div>
          ))}
        </dl>
        {brief.sourceMeetings.length === 0 ? (
          <p className="mt-3 text-[12px] text-cc-t3">
            No analysed meeting yet, so there is nothing to brief from beyond the CRM record above.
          </p>
        ) : (
          <>
            {brief.desiredOutcome ? (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Desired outcome</p>
                <p className="text-[12.5px] text-cc-ink">
                  {brief.desiredOutcome.value}
                  <Confidence value={brief.desiredOutcome.confidence} />
                </p>
              </div>
            ) : null}
            <BriefList label="Suggested agenda" items={brief.suggestedAgenda} />
            <BriefList label="Goals on the table" items={brief.goals} />
            <BriefList label="Still unresolved" items={brief.unresolvedQuestions} />
            <BriefList label="Objections raised before" items={brief.objections} />
            <BriefList label="What we committed to" items={brief.commitments} />
            <BriefList label="What to present" items={brief.whatToPresent} />
            <BriefList label="What not to repeat" items={brief.whatNotToRepeat} />
          </>
        )}
      </div>

      {meetings.length === 0 ? (
        <p className="rounded-cc-card border border-dashed border-cc-line-strong bg-cc-surface px-6 py-10 text-center text-sm text-cc-t3">
          No meetings are linked to this lead.
        </p>
      ) : (
        <ul className="space-y-3">
          {insightsByMeeting.map(({ meeting, insights }) => {
            const intelligence = MeetingIntelligenceSchema.safeParse(
              insights.find((insight) => insight.insightType === "meeting_intelligence")?.payload,
            );
            const presentation = PresentationIntelligenceSchema.safeParse(
              insights.find((insight) => insight.insightType === "presentation_intelligence")?.payload,
            );

            return (
              <li key={meeting.id} className="rounded-cc-card border border-cc-line bg-cc-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-cc-ink">{meeting.title ?? "Untitled meeting"}</p>
                  <span data-meeting-status={meeting.status} className="text-[11px] text-cc-t3">
                    {MEETING_STATUS_LABEL[meeting.status]}
                  </span>
                </div>

                <Link
                  href={`/dashboard/meetings/${meeting.id}`}
                  className="mt-1 inline-block text-[12px] text-cc-t3 underline"
                >
                  Open meeting
                </Link>

                {intelligence.success ? (
                  <>
                    {hasValue(intelligence.data.executiveSummary) ? (
                      <p className="mt-3 text-[12.5px] text-cc-ink">
                        <FieldLine field={intelligence.data.executiveSummary} />
                      </p>
                    ) : null}
                    <FieldList label="Requirements" fields={intelligence.data.requirements} />
                    <FieldList label="Client problems" fields={intelligence.data.clientProblems} />
                    <FieldList label="Objections" fields={intelligence.data.objections} />
                    <FieldList label="Buying signals" fields={intelligence.data.buyingSignals} />
                    <FieldList label="Open questions" fields={intelligence.data.openQuestions} />
                    <FieldList label="Next actions" fields={intelligence.data.nextActions} />
                  </>
                ) : (
                  <p className="mt-3 text-[12px] text-cc-t3">
                    This meeting has not been analysed yet.
                  </p>
                )}

                {presentation.success ? (
                  <>
                    <FieldList label="Next presentation — agenda" fields={presentation.data.recommendedAgenda} />
                    <FieldList label="Next presentation — what to present" fields={presentation.data.whatToPresent} />
                    <FieldList label="Next presentation — what NOT to present" fields={presentation.data.whatNotToPresent} />
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
