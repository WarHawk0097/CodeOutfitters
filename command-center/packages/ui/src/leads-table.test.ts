// pageWindow drives the canonical C-D05 footer control (`‹ 1 2 3 … 13 ›`,
// CANON 133). The 128-record dataset at 10 per page is exactly 13 pages, so the
// three-page window plus ellipsis is the shape that ships — it is worth pinning.
import { describe, expect, it } from "vitest";
import { pageWindow } from "./leads-table";

describe("pageWindow", () => {
  it("lists every page when there are five or fewer", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(3, 3)).toEqual([1, 2, 3]);
  });

  it("renders the canonical first-page shape for the 13-page dataset", () => {
    expect(pageWindow(1, 13)).toEqual([1, 2, 3, "ellipsis", 13]);
  });

  it("keeps the current page inside the window in the middle of the range", () => {
    expect(pageWindow(7, 13)).toEqual([1, "ellipsis", 6, 7, 8, "ellipsis", 13]);
  });

  it("clamps the window at the end rather than running past the last page", () => {
    expect(pageWindow(13, 13)).toEqual([1, "ellipsis", 10, 11, 12, 13]);
  });
});
