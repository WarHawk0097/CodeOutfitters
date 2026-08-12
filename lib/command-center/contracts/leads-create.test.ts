import { describe, expect, it } from "vitest";
import { LeadsCreateRequestSchema } from "./leads";

// LeadsCreateRequestSchema — the manual Add Lead form's request shape. No status field
// (see leads.ts's comment on the schema): a manual lead always starts at the table default.
describe("LeadsCreateRequestSchema", () => {
  it("accepts the minimum required fields", () => {
    const result = LeadsCreateRequestSchema.safeParse({
      firstName: "Ada",
      businessName: "Lovelace Ltd",
      workEmail: "ada@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing first name", () => {
    const result = LeadsCreateRequestSchema.safeParse({
      businessName: "Lovelace Ltd",
      workEmail: "ada@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing business name", () => {
    const result = LeadsCreateRequestSchema.safeParse({
      firstName: "Ada",
      workEmail: "ada@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = LeadsCreateRequestSchema.safeParse({
      firstName: "Ada",
      businessName: "Lovelace Ltd",
      workEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("has no status field to misuse — a manual lead cannot skip the pipeline", () => {
    expect(LeadsCreateRequestSchema.shape).not.toHaveProperty("status");
  });
});
