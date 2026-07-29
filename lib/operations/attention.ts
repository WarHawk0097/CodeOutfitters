// The predicates behind the Overview's operational counts.
//
// Each of these was written twice: once on the Overview to produce a number, and once
// on the list screen the number was supposed to open. Two copies of "which proposals
// need attention" is how a card claiming 3 opens a list showing 5 — the count and the
// records stop describing the same set and nobody notices, because each side is
// internally consistent. They live here so the count and its destination are the same
// function, and a change to one is a change to both.
//
// The tasks half of the same idea already had a home: `filterByView` and
// `leadIdsWithoutNextAction` in lib/tasks/model.ts. Nothing is duplicated from there.
import type { Meeting, MeetingState, Proposal, ProposalState } from "../demo/types";

/**
 * A meeting to prepare is one that is scheduled and ready to be walked into — the
 * work is the preparation, and it stops being outstanding the moment the meeting
 * starts. LIVE and everything after it is somebody else's question.
 */
export const MEETING_PREPARE_STATES: readonly MeetingState[] = ["READY"];

export function needsPreparation(meeting: Meeting): boolean {
  return MEETING_PREPARE_STATES.includes(meeting.state);
}

export function meetingsToPrepare(meetings: readonly Meeting[]): Meeting[] {
  return meetings.filter(needsPreparation);
}

/** A meeting needing review is one that happened and has not been dealt with yet. */
export const MEETING_REVIEW_STATES: readonly MeetingState[] = ["NEEDS REVIEW"];

export function meetingsNeedingReview(meetings: readonly Meeting[]): Meeting[] {
  return meetings.filter((meeting) => MEETING_REVIEW_STATES.includes(meeting.state));
}

/**
 * Proposal states that mean somebody here has to do something. ACCEPTED, REJECTED,
 * EXPIRED and ARCHIVED are settled; SENT and APPROVED are correctly parked on the
 * other side of the table.
 */
export const PROPOSAL_ATTENTION_STATES: readonly ProposalState[] = [
  "DRAFT",
  "INTERNAL REVIEW",
  "CHANGES REQUESTED",
  "VIEWED",
];

export function needsAttention(proposal: Proposal): boolean {
  return PROPOSAL_ATTENTION_STATES.includes(proposal.state);
}

export function proposalsNeedingAttention(proposals: readonly Proposal[]): Proposal[] {
  return proposals.filter(needsAttention);
}
