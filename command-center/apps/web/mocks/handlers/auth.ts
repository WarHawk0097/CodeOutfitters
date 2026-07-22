// msw handler for auth.login — api-contracts.json errors: 401 invalid / 423 locked / 503 unavailable.
import { http, HttpResponse } from "msw";
import { LoginRequestSchema } from "@command-center/contracts";

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: { code: "invalid", message: "invalid credentials", status: 401 } }, { status: 401 });
    }
    if (parsed.data.email === "locked@example.test") {
      return HttpResponse.json({ error: { code: "locked", message: "account locked", status: 423 } }, { status: 423 });
    }
    return HttpResponse.json({
      userId: "user-001",
      role: "sales",
      token: "mock-token-001",
      issuedAt: "2026-01-05T09:00:00.000Z",
    });
  }),
];
