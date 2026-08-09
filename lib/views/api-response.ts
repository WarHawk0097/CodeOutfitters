// Shared JSON envelope for the Saved Views API routes. Same shape as
// lib/ai/server/copilot-history.ts's jsonOk/jsonError — not imported from there because that
// module's body types are Copilot-specific, but the wire contract matches deliberately, so a
// client handling one API error shape handles both.
import "server-only";

export type SavedViewApiErrorBody = {
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
  const body: SavedViewApiErrorBody = { ok: false, error: { code, message, ...(fields ? { fields } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "x-correlation-id": correlationId },
  });
}
