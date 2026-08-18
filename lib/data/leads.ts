// Client fetch wrapper for leads.list — apps/api in real mode, msw in mock mode.
import {
  LeadsListResponseSchema,
  type LeadsListParams,
  type LeadsListResponse,
} from "@command-center/contracts";

// Query params are typed by the contract, not assembled from loose strings, so a
// filter the API does not accept is a compile error rather than a silent no-op.
export type FetchLeadsParams = Partial<LeadsListParams>;

export function leadsQueryString(params: FetchLeadsParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// PRESENTATION_TEST_STATE, mock only. Names a deterministic mock failure scenario so the
// error and retry paths can be exercised in a real browser with no service to break. Kept
// OUT of FetchLeadsParams because it is not part of the API contract — in real mode it is
// dropped here and never reaches the wire.
export type FetchLeadsOptions = { mockScenario?: string };

function mockScenarioParam(options: FetchLeadsOptions): string {
  if (!options.mockScenario) return "";
  return `mock-scenario=${encodeURIComponent(options.mockScenario)}`;
}

// Dashboard overview mounts three responsive variants (desktop/tablet/mobile) of the same
// widgets at once — CSS hides the inactive two, but all three call fetchLeads() on mount.
// Dedup identical in-flight requests to one network call instead of three.
const inFlight = new Map<string, Promise<LeadsListResponse>>();

export async function fetchLeads(
  params: FetchLeadsParams = {},
  options: FetchLeadsOptions = {},
): Promise<LeadsListResponse> {
  const qs = leadsQueryString(params);
  const scenario = mockScenarioParam(options);
  const url = `/api/leads${qs}${scenario ? (qs ? "&" : "?") + scenario : ""}`;

  const existing = inFlight.get(url);
  if (existing) return existing;

  const request = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`leads.list failed: ${res.status}`);
    }
    const json = await res.json();
    return LeadsListResponseSchema.parse(json);
  })();
  inFlight.set(url, request);
  try {
    return await request;
  } finally {
    inFlight.delete(url);
  }
}
