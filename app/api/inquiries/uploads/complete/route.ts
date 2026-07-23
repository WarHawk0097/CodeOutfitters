import { z } from "zod";
import { completeInquiryUpload, UploadError } from "@/lib/inquiry/server/storage/inquiry-upload-service";

export const runtime = "nodejs";

// Thin Route Handler (Work Order E Step 10, phase 3). The browser calls this
// after PUTting the bytes. The service verifies the real object, scans it, and
// returns the single-use opaque token ONLY on a clean scan.
const CompleteSchema = z.object({
  submissionId: z.uuid(),
  attachmentId: z.uuid(),
});

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: { code: "bad_request", message: "Malformed JSON." } });
  }
  const parsed = CompleteSchema.safeParse(raw);
  if (!parsed.success) {
    return json(422, { ok: false, error: { code: "validation", message: "Invalid completion request." } });
  }
  try {
    const result = await completeInquiryUpload(parsed.data);
    return json(200, { ok: true, ...result });
  } catch (err) {
    if (err instanceof UploadError) {
      return json(err.status, { ok: false, error: { code: err.reason, message: err.message } });
    }
    return json(500, { ok: false, error: { code: "server_error", message: "Upload could not be completed." } });
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
