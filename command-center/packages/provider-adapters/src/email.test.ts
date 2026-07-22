import { describe, expect, it } from "vitest";
import { MockEmailProvider } from "./email";

describe("MockEmailProvider", () => {
  it("defaults to NOT_CONFIGURED", () => {
    expect(new MockEmailProvider().status).toBe("NOT_CONFIGURED");
  });

  it("simulates success", async () => {
    const result = await new MockEmailProvider().sendEmail("ok@example.test", "welcome", {});
    expect(result.status).toBe("sent");
  });

  it("simulates failure", async () => {
    const result = await new MockEmailProvider().sendEmail("fail@example.test", "welcome", {});
    expect(result.status).toBe("email_failed");
  });
});
