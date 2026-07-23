import { z } from "zod";
import { deleteInquiryUpload, UploadError } from "@/lib/inquiry/server/storage/inquiry-upload-service";

export const runtime = "nodejs";

// Thin Route Handler (Work Order E Step 10). Removes a not-yet-associated
// in-progress upload by its attachmentId ONLY — never by an arbitrary storage
// path. Deletion is scoped to the caller's provisional submissionId, so one
// visitor can never delete another's attachment. Already-submitted attachments
// cannot be removed here.
const Uuid = z.uuid();

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
): Promise<Response> {
  const { attachmentId } = await params;
  const submissionId = new URL(req.url).searchParams.get("submissionId") ?? "";
  if (!Uuid.safeParse(attachmentId).success || !Uuid.safeParse(submissionId).success) {
    return json(422, { ok: false, error: { code: "validation", message: "Invalid delete request." } });
  }
  try {
    await deleteInquiryUpload(submissionId, attachmentId);
    return json(200, { ok: true });
  } catch (err) {
    if (err instanceof UploadError) {
      return json(err.status, { ok: false, error: { code: err.reason, message: err.message } });
    }
    return json(500, { ok: false, error: { code: "server_error", message: "Attachment could not be removed." } });
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
