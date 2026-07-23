import "server-only";

// Malware-scanning abstraction (spec §11 / Work Order E Step 11). Downloads are
// blocked unless scan status is exactly 'clean'. The scanner is pluggable; the
// local integration path uses a REAL ClamAV container (clamav-inquiry-file-
// scanner). A deterministic scanner exists for unit tests only.
//
// Status semantics (spec):
//   clean       — scanned, no threat.
//   rejected    — scanned, threat found. Never downloadable.
//   failed      — scan ran but errored on this object.
//   unavailable — scanner could not be reached / timed out.
//   pending     — not yet scanned (DB default before completion).
export type ScanStatus = "pending" | "clean" | "rejected" | "failed" | "unavailable";

export type ScanResult = {
  status: Exclude<ScanStatus, "pending">;
  // Non-PII signature/category label (e.g. the ClamAV signature name) — safe to
  // store and log; never contains file content or user data.
  signature?: string;
};

export interface InquiryFileScanner {
  scan(bytes: Uint8Array): Promise<ScanResult>;
}

// The EICAR standard antivirus test string — the industry-standard benign
// payload every scanner flags. Used by the deterministic scanner and QA.
export const EICAR_SIGNATURE =
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

// Deterministic scanner for UNIT TESTS ONLY (never the integration path).
// Flags EICAR as rejected; everything else clean. `forceStatus` lets a test
// exercise the unavailable/failed branches without a container.
export class DeterministicInquiryFileScanner implements InquiryFileScanner {
  constructor(private readonly forceStatus?: ScanResult) {}

  async scan(bytes: Uint8Array): Promise<ScanResult> {
    if (this.forceStatus) return this.forceStatus;
    const text = Buffer.from(bytes).toString("latin1");
    if (text.includes(EICAR_SIGNATURE)) {
      return { status: "rejected", signature: "Eicar-Test-Signature" };
    }
    return { status: "clean" };
  }
}
