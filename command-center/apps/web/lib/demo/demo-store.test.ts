// The shared demo data system: the seed is deterministic and internally consistent, and
// every mutation keeps related routes in agreement.
import { beforeEach, describe, expect, it } from "vitest";
import { generateLeads } from "../../mocks/fixtures/generate-leads";
import {
  cancelAppointment,
  completeFollowUp,
  completeMeeting,
  duplicateProposal,
  inviteTeamMember,
  moveOpportunity,
  removeTeamMember,
  rescheduleAppointment,
  saveSettingsSection,
  sendEmail,
  setEmailArchived,
  setProposalState,
  snoozeFollowUp,
} from "./actions";
import { createSeedState, PIPELINE_ACTIVE_COUNT, STAGE_TARGET_COUNTS, TEAM_SEED } from "./seed";
import { getDemoState, resetDemoState, updateDemoState } from "./store";

const LEAD_IDS = new Set(generateLeads().map((lead) => lead.id));

describe("seed", () => {
  const seed = createSeedState();

  it("is deterministic — two builds are identical", () => {
    expect(JSON.stringify(createSeedState())).toBe(JSON.stringify(seed));
  });

  it("puts every opportunity on a real lead", () => {
    expect(seed.opportunities.length).toBe(PIPELINE_ACTIVE_COUNT);
    for (const opportunity of seed.opportunities) {
      expect(LEAD_IDS.has(opportunity.leadId)).toBe(true);
    }
  });

  it("gives every stage its target count with no duplicated card", () => {
    for (const [stage, want] of Object.entries(STAGE_TARGET_COUNTS)) {
      expect(seed.opportunities.filter((o) => o.stage === stage).length).toBe(want);
    }
    expect(new Set(seed.opportunities.map((o) => o.id)).size).toBe(seed.opportunities.length);
  });

  it("links every appointment, meeting, proposal, follow-up and email to a real lead", () => {
    const rows = [...seed.appointments, ...seed.meetings, ...seed.proposals, ...seed.followUps, ...seed.emails];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(LEAD_IDS.has(row.leadId)).toBe(true);
  });

  it("owns every record with a real team member or the unassigned owner", () => {
    const owners = new Set([...TEAM_SEED.map((m) => m.id), "unassigned"]);
    const rows = [...seed.opportunities, ...seed.appointments, ...seed.meetings, ...seed.proposals, ...seed.followUps];
    for (const row of rows) expect(owners.has(row.ownerId)).toBe(true);
  });

  it("never claims a meeting provider is configured", () => {
    for (const meeting of seed.meetings) expect(meeting.joinUrl).toBe("");
  });
});

describe("mutations", () => {
  beforeEach(() => {
    resetDemoState();
  });

  it("moving an opportunity moves exactly one card and writes through to the lead", () => {
    const before = getDemoState();
    const card = before.opportunities.find((o) => o.stage === "Contacted")!;
    const contactedBefore = before.opportunities.filter((o) => o.stage === "Contacted").length;

    moveOpportunity(card.id, "Negotiation");

    const after = getDemoState();
    expect(after.opportunities.length).toBe(before.opportunities.length);
    expect(after.opportunities.filter((o) => o.id === card.id).length).toBe(1);
    expect(after.opportunities.find((o) => o.id === card.id)!.stage).toBe("Negotiation");
    expect(after.opportunities.filter((o) => o.stage === "Contacted").length).toBe(contactedBefore - 1);
    expect(after.leadOverrides[card.leadId]?.status).toBe("Negotiation");
    expect(after.activity[0]!.message).toContain("Negotiation");
  });

  it("accepting a proposal wins the linked opportunity and the lead", () => {
    const proposal = getDemoState().proposals.find((p) => p.opportunityId)!;
    setProposalState(proposal.id, "ACCEPTED");
    const after = getDemoState();
    expect(after.proposals.find((p) => p.id === proposal.id)!.state).toBe("ACCEPTED");
    expect(after.opportunities.find((o) => o.id === proposal.opportunityId)!.stage).toBe("Won");
    expect(after.leadOverrides[proposal.leadId]?.status).toBe("Won");
  });

  it("duplicating a proposal makes a new draft at the next version", () => {
    const source = getDemoState().proposals.find((p) => p.version === "v2")!;
    const id = duplicateProposal(source.id);
    const copy = getDemoState().proposals.find((p) => p.id === id)!;
    expect(copy.id).not.toBe(source.id);
    expect(copy.version).toBe("v3");
    expect(copy.state).toBe("DRAFT");
  });

  it("completing a follow-up updates the lead's next step", () => {
    const followUp = getDemoState().followUps.find((f) => f.state === "OVERDUE")!;
    completeFollowUp(followUp.id);
    const after = getDemoState();
    expect(after.followUps.find((f) => f.id === followUp.id)!.state).toBe("COMPLETED");
    expect(after.leadOverrides[followUp.leadId]?.nextStepLabel).toContain(followUp.type);
  });

  it("snoozing a follow-up moves its due date", () => {
    const followUp = getDemoState().followUps.find((f) => f.state === "DUE TODAY")!;
    snoozeFollowUp(followUp.id, "2026-05-01");
    const after = getDemoState().followUps.find((f) => f.id === followUp.id)!;
    expect(after.state).toBe("SNOOZED");
    expect(after.dueDate).toBe("2026-05-01");
  });

  it("rescheduling and cancelling an appointment change its state", () => {
    const appointment = getDemoState().appointments[0]!;
    rescheduleAppointment(appointment.id, "2026-04-29", "11:00", "11:45");
    expect(getDemoState().appointments.find((a) => a.id === appointment.id)!.state).toBe("rescheduled");
    cancelAppointment(appointment.id, "Client asked to postpone");
    const after = getDemoState().appointments.find((a) => a.id === appointment.id)!;
    expect(after.state).toBe("cancelled");
    expect(after.detail).toBe("Client asked to postpone");
  });

  it("completing a meeting records the outcome against the lead", () => {
    const meeting = getDemoState().meetings.find((m) => m.state === "NEEDS REVIEW")!;
    completeMeeting(meeting.id, "Requirements approved", "Six requirements confirmed");
    const after = getDemoState();
    expect(after.meetings.find((m) => m.id === meeting.id)!.state).toBe("COMPLETED");
    expect(after.leadOverrides[meeting.leadId]?.nextStepLabel).toBe("Requirements approved");
  });

  it("archiving an email and sending one are local-only state changes", () => {
    const email = getDemoState().emails[0]!;
    setEmailArchived(email.id, true);
    expect(getDemoState().emails.find((e) => e.id === email.id)!.state).toBe("ARCHIVED");

    const { id: _existingId, ...draft } = email;
    const id = sendEmail({ ...draft, subject: "Demo message", state: "SENT", archived: false, read: true });
    const sent = getDemoState().emails.find((e) => e.id === id)!;
    expect(sent.subject).toBe("Demo message");
    expect(getDemoState().activity[0]!.message).toContain("no email was delivered");
  });

  it("removing a team member reassigns everything they owned", () => {
    const id = inviteTeamMember("Casey Lin", "casey@codeoutfitters.com", "Sales");
    expect(getDemoState().team.find((m) => m.id === id)!.status).toBe("Pending");

    const victim = "user-001";
    removeTeamMember(victim);
    const after = getDemoState();
    expect(after.team.some((m) => m.id === victim)).toBe(false);
    const owned = [...after.opportunities, ...after.appointments, ...after.meetings, ...after.proposals, ...after.followUps];
    expect(owned.some((row) => row.ownerId === victim)).toBe(false);
  });

  it("settings save writes normal fields and refuses credential fields", () => {
    saveSettingsSection("ai", { consentMessage: "Updated consent copy", aiProvider: "sk-should-never-be-stored" });
    const section = getDemoState().settings.find((s) => s.id === "ai")!;
    expect(section.fields.find((f) => f.id === "consentMessage")!.value).toBe("Updated consent copy");
    expect(section.fields.find((f) => f.id === "aiProvider")!.value).not.toContain("sk-");
  });

  it("reset returns the store to the deterministic seed", () => {
    const card = getDemoState().opportunities[0]!;
    moveOpportunity(card.id, "Won");
    expect(getDemoState().activity.length).toBeGreaterThan(0);
    resetDemoState();
    expect(getDemoState().activity.length).toBe(0);
    expect(getDemoState().opportunities[0]!.stage).toBe(card.stage);
  });

  it("mints ids without a clock, so the same sequence replays identically", () => {
    updateDemoState((current) => ({ ...current }));
    const first = inviteTeamMember("A B", "ab@example.com", "Sales");
    resetDemoState();
    const second = inviteTeamMember("A B", "ab@example.com", "Sales");
    expect(second).toBe(first);
  });
});
