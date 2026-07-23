import "server-only";
import type { InquirySubmissionRequest } from "../inquiry-schema";
import { hashAttachmentToken } from "./storage/inquiry-upload-token";

// Bridges the wire contract (raw opaque `attachmentTokens`) to what the
// atomic submit_inquiry DB function consumes (`attachmentTokenHashes`, Work
// Order E Step 13). Raw tokens are SHA-256 hashed here and the raw values are
// stripped — no raw attachment token is ever sent to, or stored by, the
// database. The DB matches these hashes against inquiry_attachments.
// attachment_token_hash under FOR UPDATE and consumes them single-use.
export function toSubmitPayload(payload: InquirySubmissionRequest): Record<string, unknown> {
  const { attachmentTokens, ...rest } = payload as InquirySubmissionRequest & {
    attachmentTokens?: string[];
  };
  const attachmentTokenHashes = (attachmentTokens ?? []).map(hashAttachmentToken);
  return { ...rest, attachmentTokenHashes };
}
