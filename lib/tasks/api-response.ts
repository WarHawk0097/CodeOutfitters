// Shared JSON envelope for the Tasks API routes. Same shape as lib/views/api-response.ts —
// duplicated rather than imported so each domain's error body type stays independent.
import "server-only";

export type TaskApiErrorBody = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store" } as const;

export function jsonOk(body: Record<string, unknown>, correlationId: string): Response {
  return new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200,
    headers: { ...JSON_HEADERS, "x-correlation-id": correlationId },
  });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  correlationId: string,
  fields?: Record<string, string>,
): Response {
  const body: TaskApiErrorBody = { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "x-correlation-id": correlationId },
  });
}
