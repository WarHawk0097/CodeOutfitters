import { describe, expect, it } from "vitest";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  validateFiles,
} from "./inquiry-upload-validation";

function file(name: string, bytes: number, type = ""): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("validateFiles", () => {
  it("accepts allow-listed types by mime or extension", () => {
    const { accepted, rejected } = validateFiles([
      file("brief.pdf", 100, "application/pdf"),
      file("data.csv", 100), // empty type -> extension fallback
    ]);
    expect(accepted).toHaveLength(2);
    expect(rejected).toHaveLength(0);
  });

  it("rejects unsupported types", () => {
    const { accepted, rejected } = validateFiles([file("evil.exe", 100, "application/x-msdownload")]);
    expect(accepted).toHaveLength(0);
    expect(rejected[0].reason).toBe("Unsupported file type.");
  });

  it("rejects files larger than the 10 MB cap", () => {
    const { rejected } = validateFiles([file("huge.png", MAX_FILE_BYTES + 1, "image/png")]);
    expect(rejected[0].reason).toContain("larger than 10 MB");
  });

  it("enforces the max file count against the existing selection", () => {
    const existing = Array.from({ length: MAX_FILES }, (_, i) => file(`f${i}.pdf`, 10, "application/pdf"));
    const { accepted, rejected } = validateFiles([file("one-more.pdf", 10, "application/pdf")], existing);
    expect(accepted).toHaveLength(0);
    expect(rejected[0].reason).toContain(`${MAX_FILES} files`);
  });
});
