import { describe, it, expect } from "vitest";
import { validateUploadedFile } from "./inquiry-file-validation";
import { sanitizeFilename } from "./inquiry-filename";

function bytes(...b: number[]): Uint8Array {
  return new Uint8Array(b);
}

const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0);
const OLE = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
const CSV = new TextEncoder().encode("name,email\nAda,ada@example.com\n");

describe("validateUploadedFile", () => {
  it("accepts a real PDF", () => {
    const r = validateUploadedFile({ filename: "report.pdf", declaredMime: "application/pdf", byteSize: PDF.length, bytes: PDF });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.detectedMime).toBe("application/pdf");
  });

  it("accepts png, jpeg, docx(zip), xlsx(zip), doc(ole), csv", () => {
    expect(validateUploadedFile({ filename: "a.png", declaredMime: "image/png", byteSize: PNG.length, bytes: PNG }).ok).toBe(true);
    expect(validateUploadedFile({ filename: "a.jpg", declaredMime: "image/jpeg", byteSize: JPEG.length, bytes: JPEG }).ok).toBe(true);
    expect(validateUploadedFile({ filename: "a.docx", declaredMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", byteSize: ZIP.length, bytes: ZIP }).ok).toBe(true);
    expect(validateUploadedFile({ filename: "a.xlsx", declaredMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", byteSize: ZIP.length, bytes: ZIP }).ok).toBe(true);
    expect(validateUploadedFile({ filename: "a.doc", declaredMime: "application/msword", byteSize: OLE.length, bytes: OLE }).ok).toBe(true);
    expect(validateUploadedFile({ filename: "a.csv", declaredMime: "text/csv", byteSize: CSV.length, bytes: CSV }).ok).toBe(true);
  });

  it("rejects unsupported extension", () => {
    expect(validateUploadedFile({ filename: "evil.exe", declaredMime: "application/octet-stream", byteSize: 4, bytes: PDF }).ok).toBe(false);
  });

  it("rejects zero-byte", () => {
    expect(validateUploadedFile({ filename: "a.pdf", declaredMime: "application/pdf", byteSize: 0, bytes: bytes() }).ok).toBe(false);
  });

  it("rejects a PDF-named file that is actually a PNG (signature mismatch)", () => {
    const r = validateUploadedFile({ filename: "fake.pdf", declaredMime: "application/pdf", byteSize: PNG.length, bytes: PNG });
    expect(r.ok).toBe(false);
  });

  it("rejects a declared MIME that contradicts the extension", () => {
    const r = validateUploadedFile({ filename: "a.pdf", declaredMime: "image/png", byteSize: PDF.length, bytes: PDF });
    expect(r.ok).toBe(false);
  });

  it("rejects a CSV that contains NUL bytes (binary smuggled as csv)", () => {
    const r = validateUploadedFile({ filename: "a.csv", declaredMime: "text/csv", byteSize: 3, bytes: bytes(0x41, 0x00, 0x42) });
    expect(r.ok).toBe(false);
  });

  it("rejects over the hard 10 MB ceiling", () => {
    const r = validateUploadedFile({ filename: "a.pdf", declaredMime: "application/pdf", byteSize: 11 * 1024 * 1024, bytes: PDF });
    expect(r.ok).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("strips path separators and keeps the allowed extension", () => {
    expect(sanitizeFilename("../../etc/passwd.pdf", "pdf")).toBe("passwd.pdf");
    expect(sanitizeFilename("C:\\Users\\me\\Q3 Report.pdf", "pdf")).toBe("Q3 Report.pdf");
  });
  it("falls back to a safe stem when nothing usable remains", () => {
    expect(sanitizeFilename("....pdf", "pdf")).toBe("attachment.pdf");
  });
  it("removes control and unsafe characters", () => {
    expect(sanitizeFilename("a<b>c:name.pdf", "pdf")).toBe("abcname.pdf");
  });
});
