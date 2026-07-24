// Leads screen, C-D05 per work/PHASED-IMPLEMENTATION-PLAN.md Phase 3.
// Server component shell; LeadsData client island owns fetchLeads() + LeadsTable
// (same relative-URL/msw-browser-worker constraint as dashboard/overview-data.tsx).
import { LeadsData } from "./leads-data";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      {/* The Leads h1 lives in the shell header (C-D05 143 / MO-02 1069). */}
      <LeadsData />
    </div>
  );
}
