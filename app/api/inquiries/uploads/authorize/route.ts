import { z } from "zod";
import { authorizeInquiryUpload, UploadError } from "@/lib/inquiry/server/storage/inquiry-upload-service";

// Node runtime: service-role Supabase client + node:crypto require it.
export const runtime = "nodejs";

// Thin Route Handler (Work Order E Step 10, phase 1). Validate -> service ->
// map. No storage/DB orchestration here; all of it lives in the upload service.
// Only the three upload-bearing form variants are accepted.
const AuthorizeSchema = z.object({
  submissionId: z.uuid(),
  formVariant: z.enum(["contact_full", "services_compact", "industries_compact"]),
  filename: z.string().min(1).max(255),
  declaredMime: z.string().max(255).default(""),
  byteSize: z.number().int().positive(),
});

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { code: "bad_request", message: "Malformed JSON." });
  }
  const parsed = AuthorizeSchema.safeParse(raw);
  if (!parsed.success) {
    return json(422, { code: "validation", message: "Invalid upload request." });
  }
  try {
    const result = await authorizeInquiryUpload(parsed.data);
    return json(201, { ok: true, ...result });
  } catch (err) {
    return mapError(err);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mapError(err: unknown): Response {
  if (err instanceof UploadError) {
    return json(err.status, { ok: false, error: { code: err.reason, message: err.message } });
  }
  // Never leak internals.
  return json(500, { ok: false, error: { code: "server_error", message: "Upload could not be authorized." } });
}
