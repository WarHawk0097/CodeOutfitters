import { describe, expect, it } from "vitest";
import { LoginRequestSchema, LoginResponseSchema } from "./auth";

describe("auth contracts", () => {
  it("accepts a valid login request", () => {
    expect(() => LoginRequestSchema.parse({ email: "sales@codeoutfitters.test", password: "x" })).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() => LoginRequestSchema.parse({ email: "not-an-email", password: "x" })).toThrow();
  });

  it("accepts a valid login response", () => {
    expect(() =>
      LoginResponseSchema.parse({
        userId: "user-001",
        role: "sales",
        token: "mock-token",
        issuedAt: "2026-01-05T09:00:00.000Z",
      }),
    ).not.toThrow();
  });
});
