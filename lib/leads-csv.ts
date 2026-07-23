// CSV export for the Leads list.
//
// Exports the COMPLETE current result set — every row matching the active filters, in the
// active sort order, across every page — not the ten rows on screen. Rows are read through
// the same typed data boundary the table uses (fetchLeads); no fixture is imported and no
// second source of truth exists.
import {
  APPOINTMENT_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  UNKNOWN_OWNER_LABEL,
  type Lead,
  type OwnerFacet,
} from "@command-center/contracts";
import { fetchLeads, type FetchLeadsParams } from "./data/leads";

// Large enough that 128 records arrive in one request, small enough to stay inside the
// contract's max of 200. The loop below does not depend on it.
const EXPORT_PAGE_SIZE = 200;

// Hard stop against a server that keeps answering with rows but never reaches `total`.
// An export that spins forever is worse than one that fails loudly.
const MAX_EXPORT_REQUESTS = 50;

export const CSV_COLUMNS = [
  "Lead",
  "Company",
  "Service",
  "Status",
  "Owner",
  "Appointment",
  "Next Step",
  "Created",
] as const;

// RFC 4180. A field is quoted when it contains a comma, a quote, CR or LF; inner quotes
// double. Everything is stringified first, so a null or undefined becomes "" rather than
// the literal word.
export function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

// Human-facing values only. No raw provider id, no internal owner id, no snake_case enum:
// the owner label is resolved from the response's owner directory and the two enums from
// their canonical label maps.
export function leadToCsvRow(lead: Lead, ownerLabels: ReadonlyMap<string, string>): string[] {
  return [
    lead.name,
    lead.company,
    lead.serviceInterest ?? "",
    LEAD_STATUS_LABELS[lead.status] ?? lead.status,
    lead.ownerName ?? ownerLabels.get(lead.owner) ?? UNKNOWN_OWNER_LABEL,
    lead.appointmentStatus ? (APPOINTMENT_STATUS_LABELS[lead.appointmentStatus] ?? "") : "",
    lead.nextStepLabel ?? "",
    // The ISO instant, not the authored "2h ago" label: a relative string is meaningless
    // in a file opened next week. Date only — the list never shows a time of day.
    lead.createdAt.slice(0, 10),
  ];
}

export function buildLeadsCsv(rows: readonly Lead[], ownerFacets: readonly OwnerFacet[]): string {
  const ownerLabels = new Map(ownerFacets.map((f) => [f.id, f.label]));
  const lines = [CSV_COLUMNS.map(csvField).join(",")];
  for (const row of rows) lines.push(leadToCsvRow(row, ownerLabels).map(csvField).join(","));
  // CRLF per RFC 4180, trailing newline so the last record is terminated.
  return lines.join("\r\n") + "\r\n";
}

// Deterministic and documented: `leads-export-<n>-rows.csv`, where <n> is the number of
// data rows in the file. No clock is read, so the same filtered export produces the same
// filename on every run — which is what makes it reproducible as evidence.
export function leadsCsvFilename(rowCount: number): string {
  return `leads-export-${rowCount}-rows.csv`;
}

export type LeadsExportResult = { csv: string; rowCount: number; filename: string };

// Pages until `total` rows are collected. It does NOT assume one request is enough: the
// current dataset is 128 and the cap is 200, but a silently truncated export is exactly
// the failure this is meant to avoid.
export async function exportLeadsCsv(params: FetchLeadsParams): Promise<LeadsExportResult> {
  const collected: Lead[] = [];
  let page = 1;
  let total = 0;
  let ownerFacets: readonly OwnerFacet[] = [];

  for (let request = 0; request < MAX_EXPORT_REQUESTS; request += 1) {
    const res = await fetchLeads({ ...params, page, pageSize: EXPORT_PAGE_SIZE });
    total = res.total;
    ownerFacets = res.ownerFacets;
    collected.push(...res.rows);
    if (collected.length >= total || res.rows.length === 0) break;
    page += 1;
  }

  if (collected.length < total) {
    throw new Error(`leads export incomplete: ${collected.length} of ${total} rows`);
  }

  const csv = buildLeadsCsv(collected, ownerFacets);
  return { csv, rowCount: collected.length, filename: leadsCsvFilename(collected.length) };
}

// A BOM, because Excel on Windows reads a UTF-8 CSV as the system codepage without one and
// mangles every accented name in the dataset.
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
