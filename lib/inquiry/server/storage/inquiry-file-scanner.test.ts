import { describe, it, expect } from "vitest";
import {
  DeterministicInquiryFileScanner,
  EICAR_SIGNATURE,
} from "./inquiry-file-scanner";

// Unit tests for the deterministic scanner (no container). The real ClamAV
// path is exercised by the Docker integration suite, not here.
describe("DeterministicInquiryFileScanner", () => {
  const enc = (s: string) => new TextEncoder().encode(s);

  it("marks a benign file clean", async () => {
    const scanner = new DeterministicInquiryFileScanner();
    const result = await scanner.scan(enc("%PDF-1.4 hello"));
    expect(result.status).toBe("clean");
  });

  it("rejects the EICAR test string", async () => {
    const scanner = new DeterministicInquiryFileScanner();
    const result = await scanner.scan(enc(EICAR_SIGNATURE));
    expect(result.status).toBe("rejected");
    expect(result.signature).toBeTruthy();
  });

  it("honors a forced status for the unavailable branch", async () => {
    const scanner = new DeterministicInquiryFileScanner({ status: "unavailable" });
    const result = await scanner.scan(enc("anything"));
    expect(result.status).toBe("unavailable");
  });
});
