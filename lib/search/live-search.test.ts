// Behavioral tests for fetchLiveSearch — the one part of the live-search seam that is a plain,
// framework-free async function, so it gets a real test instead of a source-surface one (see
// live-search.ts's own header comment for why the rest of the seam does not).
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLiveSearch, liveSearchUrl } from "./live-search";
import type { CommandCenterSearchResult } from "./model";

afterEach(() => {
  vi.unstubAllGlobals();
});

const result: CommandCenterSearchResult = {
  key: "lead:1",
  type: "lead",
  id: "1",
  title: "Acme Co",
  subtitle: "Acme Inc.",
  body: "",
  status: "New",
  ownerLabel: "Jamie",
  timestampLabel: "Apr 22",
  sortKey: "2026-04-22",
  href: "/dashboard/leads/1",
  score: 1,
  group: "Leads",
  typeLabel: "Lead",
};

describe("fetchLiveSearch", () => {
  it("short-circuits below the minimum query length without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const state = await fetchLiveSearch("a", "all", new AbortController().signal);
    expect(state).toEqual({ status: "idle" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hits GET /api/dashboard/search with the trimmed query, scope, and a bounded limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, results: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await fetchLiveSearch("  acme  ", "leads", new AbortController().signal);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(liveSearchUrl("acme", "leads"));
    expect(url).toMatch(/^\/api\/dashboard\/search\?/);
    expect(url).toContain("q=acme");
    expect(url).toContain("scope=leads");
    expect(url).toContain("limit=20");
  });

  it("maps a successful response with rows to the results state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, results: [result] }) }));
    const state = await fetchLiveSearch("acme", "all", new AbortController().signal);
    expect(state).toEqual({ status: "results", results: [result] });
  });

  it("maps a successful response with no rows to the empty state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, results: [] }) }));
    const state = await fetchLiveSearch("acme", "all", new AbortController().signal);
    expect(state).toEqual({ status: "empty" });
  });

  it("maps a non-2xx response to the error state, never to demo data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }));
    const state = await fetchLiveSearch("acme", "all", new AbortController().signal);
    expect(state).toEqual({ status: "error" });
  });

  it("maps a malformed body (ok:true but no results array) to the error state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const state = await fetchLiveSearch("acme", "all", new AbortController().signal);
    expect(state).toEqual({ status: "error" });
  });

  it("maps a thrown network failure to the error state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const state = await fetchLiveSearch("acme", "all", new AbortController().signal);
    expect(state).toEqual({ status: "error" });
  });

  it("returns null (not error, not stale results) when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })),
    );
    const state = await fetchLiveSearch("acme", "all", controller.signal);
    expect(state).toBeNull();
  });
});
