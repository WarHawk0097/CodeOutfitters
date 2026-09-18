// Live meeting detail. Overview, Transcript, AI Summary, Requirements, Recommendations,
// Next Presentation and Tasks — every one of them reading real workspace data.
//
// The sibling routes under this folder (prepare / live / review / transcript) are the
// demo-presentation screens from an earlier phase and are left exactly as they are. This
// page is deliberately the *unsuffixed* route, so a link from Lead 360 reaches real data
// and can never land on a demo fixture by accident. In demo mode it 404s rather than
// inventing a meeting.
//
// Sections rather than client-side tabs: all seven are server-rendered from one pass of
// data, so they are deep-linkable, printable and readable without JavaScript. Tabs would
// add state and hide six sevenths of the record behind a click for no gain.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NextActionCard } from "@/components/dashboard/next-action-card";
import { Confidence, FieldLine, FieldList, hasValue } from "@/components/meetings/insight-fields";
import { RecordingEventsPanel } from "@/components/meetings/recording-events-panel";
import { resolveDashboardContext } from "@/lib/command-center/data";
import { isDemoMode } from "@/lib/command-center/mode";
import { captureStateSuffix, transcriptSourceLabel } from "@/lib/meetings/capture/label";
import { MeetingIntelligenceSchema, PresentationIntelligenceSchema } from "@/lib/meetings/ai/schema";
import { getLatestInsights } from "@/lib/meetings/ai/store";
import { MEETING_STATUS_LABEL } from "@/lib/meetings/status-label";
import {
  getMeeting,
  getTranscriptForArtifact,
  listArtifacts,
  listTranscriptEntries,
} from "@/lib/meetings/store";

export const metadata = { title: "Meeting — Command Center" };

const SECTION = "mb-8 rounded-cc-card border border-cc-line bg-cc-surface p-6";
const HEADING = "mb-3 text-xs font-semibold uppercase tracking-wide text-cc-t3";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const context = await resolveDashboardContext(`/dashboard/meetings/${meetingId}`);
  // Demo has no meeting plane. A fixture rendered here would be indistinguishable from a
  // real meeting, which is the one thing this screen must never be.
  if (isDemoMode()) notFound();

  // Same rule as Lead detail: a meeting in another workspace and a meeting that does not
  // exist must be indistinguishable. RLS returns null for both, and both render this 404.
  const meeting = await getMeeting(context.workspaceId, meetingId);
  if (!meeting) notFound();

  const artifacts = await listArtifacts(context.workspaceId, meetingId);
  const transcriptArtifact = artifacts.find((artifact) => artifact.artifactType === "transcript");
  const transcript = transcriptArtifact
    ? await getTranscriptForArtifact(context.workspaceId, transcriptArtifact.id)
    : null;
  const entries = transcript ? await listTranscriptEntries(context.workspaceId, transcript.id) : [];

  const insights = await getLatestInsights(context.workspaceId, meetingId);
  const intelligence = MeetingIntelligenceSchema.safeParse(
    insights.find((insight) => insight.insightType === "meeting_intelligence")?.payload,
  );
  const presentation = PresentationIntelligenceSchema.safeParse(
    insights.find((insight) => insight.insightType === "presentation_intelligence")?.payload,
  );
  const analysed = intelligence.success || presentation.success;

  return (
    <div className="cc-scope mx-auto max-w-3xl font-cc-body">
      <Link
        href={meeting.leadId ? `/dashboard/leads/${meeting.leadId}` : "/dashboard/leads"}
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-cc-t3 transition-colors hover:text-cc-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {meeting.leadId ? "Back to lead" : "Back to leads"}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-cc-ink-strong">
          {meeting.title ?? "Untitled meeting"}
        </h1>
        <span
          data-meeting-status={meeting.status}
          className="rounded-cc-control border border-cc-line bg-cc-secondary px-2.5 py-1 text-[11px] font-medium text-cc-t2"
        >
          {MEETING_STATUS_LABEL[meeting.status]}
        </span>
      </div>

      {/* Recording Events — real capture lifecycle state, polled live while a capture
          session is active. Renders only persisted truth (see events.ts header): no
          fabricated "Recording/Uploaded/Transcribed" without the underlying row. */}
      <div className="mb-6">
        <RecordingEventsPanel meetingId={meetingId} />
      </div>

      {/* Overview */}
      <section id="meeting-overview" aria-labelledby="meeting-overview-heading" className={SECTION}>
        <h2 id="meeting-overview-heading" className={HEADING}>
          Overview
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Fact label="Provider" value={meeting.provider === "google_meet" ? "Google Meet" : meeting.provider} />
          <Fact label="Scheduled start" value={meeting.scheduledStart} />
          <Fact label="Last synced" value={meeting.lastSyncedAt} />
          <Fact label="Linked lead" value={meeting.leadId ? "Linked" : "Not linked to a lead"} />
        </dl>
        {/* last_error is a state code this app wrote, never a provider response body, so
            it is safe to show and is the only thing that explains a stuck meeting. */}
        {meeting.lastError ? (
          <p role="alert" className="mt-3 text-[12px] text-cc-red-ink">
            Last sync problem: {meeting.lastError}
          </p>
        ) : null}
      </section>

      {/* Transcript */}
      <section id="meeting-transcript" aria-labelledby="meeting-transcript-heading" className={SECTION}>
        <h2 id="meeting-transcript-heading" className={HEADING}>
          Transcript
        </h2>
        {transcriptArtifact ? (
          <p className="mb-2 text-[11px] text-cc-t4">
            Transcript source: {transcriptSourceLabel(transcriptArtifact.captureSource)}
            {captureStateSuffix(transcriptArtifact.state) ? ` — ${captureStateSuffix(transcriptArtifact.state)}` : ""}
          </p>
        ) : null}
        {entries.length === 0 ? (
          <p className="text-sm text-cc-t3">{MEETING_STATUS_LABEL[meeting.status]}</p>
        ) : (
          <ol className="space-y-2" data-testid="meeting-transcript-entries">
            {entries.map((entry) => (
              <li key={entry.id} className="text-[12.5px] leading-relaxed text-cc-ink">
                {/* A speaker Meet did not attribute stays unattributed. "Unknown speaker"
                    is the honest label; a guess would put words in someone's mouth. */}
                <span className="font-semibold">{entry.speakerLabel ?? "Unknown speaker"}</span>
                {entry.startTime ? <span className="ml-2 text-[10px] text-cc-t4">{entry.startTime}</span> : null}
                <span className="ml-2">{entry.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* AI Summary */}
      <section id="meeting-summary" aria-labelledby="meeting-summary-heading" className={SECTION}>
        <h2 id="meeting-summary-heading" className={HEADING}>
          AI summary
        </h2>
        {!intelligence.success ? (
          <p className="text-sm text-cc-t3">
            {entries.length === 0
              ? "There is no transcript to analyse, so nothing has been generated for this meeting."
              : "This meeting has not been analysed yet."}
          </p>
        ) : (
          <>
            {hasValue(intelligence.data.executiveSummary) ? (
              <p className="text-[12.5px] text-cc-ink">
                <FieldLine field={intelligence.data.executiveSummary} />
              </p>
            ) : (
              <p className="text-sm text-cc-t3">The transcript did not support a summary.</p>
            )}
            <FieldList label="Client problems" fields={intelligence.data.clientProblems} />
            <FieldList label="Business goals" fields={intelligence.data.businessGoals} />
            <FieldList label="Stakeholders" fields={intelligence.data.stakeholders} />
            <FieldList label="Pain points" fields={intelligence.data.painPoints} />
            <FieldList label="Objections" fields={intelligence.data.objections} />
            <FieldList label="Buying signals" fields={intelligence.data.buyingSignals} />
            <FieldList label="Risks and blockers" fields={intelligence.data.risksAndBlockers} />
            <FieldList label="Competitors and alternatives" fields={intelligence.data.competitorsAndAlternatives} />
            <FieldList label="Open questions" fields={intelligence.data.openQuestions} />
            {/* Timeline and budget are stated explicitly even when unknown. These are the
                two fields a reader is most likely to fill in from hope, so the screen
                says outright that the meeting gave no basis for them. */}
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Timeline</p>
                <p className="mt-1 text-[12.5px] text-cc-ink">
                  {hasValue(intelligence.data.timeline) ? (
                    <FieldLine field={intelligence.data.timeline} />
                  ) : (
                    <span className="text-cc-t3">Not stated in this meeting.</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Budget and commercial signals</p>
                <p className="mt-1 text-[12.5px] text-cc-ink">
                  {hasValue(intelligence.data.budgetAndCommercialSignals) ? (
                    <FieldLine field={intelligence.data.budgetAndCommercialSignals} />
                  ) : (
                    <span className="text-cc-t3">Not stated in this meeting.</span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Requirements */}
      <section id="meeting-requirements" aria-labelledby="meeting-requirements-heading" className={SECTION}>
        <h2 id="meeting-requirements-heading" className={HEADING}>
          Requirements
        </h2>
        {intelligence.success ? (
          <FieldList
            label="Stated by the client"
            fields={intelligence.data.requirements}
            emptyLabel="No requirement was stated clearly enough to record."
          />
        ) : (
          <p className="text-sm text-cc-t3">Nothing has been analysed for this meeting yet.</p>
        )}
      </section>

      {/* Recommendations */}
      <section id="meeting-recommendations" aria-labelledby="meeting-recommendations-heading" className={SECTION}>
        <h2 id="meeting-recommendations-heading" className={HEADING}>
          Recommendations
        </h2>
        {intelligence.success ? (
          <FieldList
            label="Next actions we owe"
            fields={intelligence.data.nextActions}
            emptyLabel="Nothing was promised in this meeting."
          />
        ) : null}
        {presentation.success ? (
          <>
            {hasValue(presentation.data.recommendedObjective) ? (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Recommended objective</p>
                <p className="mt-1 text-[12.5px] text-cc-ink">
                  <FieldLine field={presentation.data.recommendedObjective} />
                </p>
              </div>
            ) : null}
            <FieldList label="Key messages" fields={presentation.data.keyMessages} />
            <FieldList label="Questions to ask" fields={presentation.data.questionsToAsk} />
            <FieldList label="Objections to prepare for" fields={presentation.data.objectionsToPrepareFor} />
          </>
        ) : analysed ? null : (
          <p className="text-sm text-cc-t3">Nothing has been analysed for this meeting yet.</p>
        )}
      </section>

      {/* Next Presentation */}
      <section id="meeting-next-presentation" aria-labelledby="meeting-next-presentation-heading" className={SECTION}>
        <h2 id="meeting-next-presentation-heading" className={HEADING}>
          Next presentation
        </h2>
        {!presentation.success ? (
          <p className="text-sm text-cc-t3">
            {entries.length === 0
              ? "A presentation plan needs a transcript to be grounded in. There is none for this meeting."
              : "No presentation plan has been generated for this meeting yet."}
          </p>
        ) : (
          <>
            <FieldList label="Suggested agenda" fields={presentation.data.recommendedAgenda} />
            <FieldList label="What to present" fields={presentation.data.whatToPresent} />
            <FieldList label="What NOT to present" fields={presentation.data.whatNotToPresent} />
            {presentation.data.demoPriorities.filter((entry) => hasValue(entry.item)).length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Demo priorities</p>
                <ul className="mt-1 space-y-1">
                  {presentation.data.demoPriorities
                    .filter((entry) => hasValue(entry.item))
                    .map((entry, index) => (
                      <li key={index} className="text-[12.5px] text-cc-ink">
                        <span className="font-semibold">{entry.priority}</span>
                        <span className="ml-2">
                          <FieldLine field={entry.item} />
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {hasValue(presentation.data.proposedSolutionShape) ? (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Proposed solution shape</p>
                <p className="mt-1 text-[12.5px] text-cc-ink">
                  <FieldLine field={presentation.data.proposedSolutionShape} />
                </p>
              </div>
            ) : null}
            {hasValue(presentation.data.nextCommercialStep) ? (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-cc-t4">Next commercial step</p>
                <p className="mt-1 text-[12.5px] text-cc-ink">
                  {presentation.data.nextCommercialStep.value}
                  <Confidence value={presentation.data.nextCommercialStep.confidence} />
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Tasks */}
      <section id="meeting-tasks" aria-labelledby="meeting-tasks-heading" className="mb-8">
        <h2 id="meeting-tasks-heading" className={HEADING}>
          Tasks
        </h2>
        <NextActionCard
          kind="meeting"
          recordId={meetingId}
          recordLabel={meeting.title ?? "Untitled meeting"}
          leadId={meeting.leadId}
        />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-cc-t4">{label}</dt>
      <dd className="mt-0.5 text-sm text-cc-ink">{value ?? "Not recorded"}</dd>
    </div>
  );
}
