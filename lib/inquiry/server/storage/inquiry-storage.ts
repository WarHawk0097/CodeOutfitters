import "server-only";
import type { InquiryStorageProvider } from "./inquiry-storage-provider";
import { SupabaseInquiryStorageProvider } from "./supabase-inquiry-storage-provider";
import type { InquiryFileScanner } from "./inquiry-file-scanner";
import { DeterministicInquiryFileScanner } from "./inquiry-file-scanner";
import { ClamAvInquiryFileScanner, clamAvConfigFromEnv } from "./clamav-inquiry-file-scanner";

// Composition root for the inquiry storage path (Work Order E Step 9/11). ONE
// Supabase-backed provider; no filesystem alternative. The scanner is selected
// by INQUIRY_FILE_SCANNER_MODE so the same code runs ClamAV locally and (later)
// in production, changing only configuration.

export function getInquiryStorageProvider(): InquiryStorageProvider {
  return new SupabaseInquiryStorageProvider();
}

export function getInquiryFileScanner(): InquiryFileScanner {
  const mode = (process.env.INQUIRY_FILE_SCANNER_MODE ?? "clamav").toLowerCase();
  switch (mode) {
    case "clamav":
      return new ClamAvInquiryFileScanner(clamAvConfigFromEnv());
    case "deterministic":
      // Unit/dev only. Never the production integration path.
      return new DeterministicInquiryFileScanner();
    default:
      throw new Error(`Unsupported INQUIRY_FILE_SCANNER_MODE: ${mode}`);
  }
}
