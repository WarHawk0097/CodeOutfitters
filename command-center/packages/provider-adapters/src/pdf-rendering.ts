// PdfRenderingProvider — work/PROVIDER-ADAPTER-PLAN.md row 7
// Shape: renderProposalPdf(sections) -> {url/bytes}. Mock strategy: fixture-based canned PDF bytes/URL.
// api-contracts.json proposals.pdf errors: font, image, overflow.
import type { ProviderStatus } from "./types";

export type PdfRenderingError = "font" | "image" | "overflow";

export interface RenderPdfResult {
  url: string;
  generatedAt: string;
}

export interface PdfRenderingProvider {
  status: ProviderStatus;
  renderProposalPdf(sections: string[]): Promise<RenderPdfResult | { error: PdfRenderingError }>;
}

export class MockPdfRenderingProvider implements PdfRenderingProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async renderProposalPdf(sections: string[]): Promise<RenderPdfResult | { error: PdfRenderingError }> {
    if (sections.includes("__trigger_overflow__")) {
      return { error: "overflow" };
    }
    return {
      url: "https://mock.storage.test/proposals/proposal-mock-001.pdf",
      generatedAt: "2026-01-05T09:00:00.000Z",
    };
  }
}
