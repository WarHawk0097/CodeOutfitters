# Canonical C-D05 Facet Popover — Design-Only Reference Values

**Status:** design-only illustrative values. NOT API truth. NOT mock truth.

## Source

`Dashboard/Command Center Final.dc.html`, line 155 (the open popover element in the
C-D05 Leads frame). Reproduce with:

```bash
grep -n "FACETED COUNTS" "Dashboard/Command Center Final.dc.html"
sed -n '155p' "Dashboard/Command Center Final.dc.html"
```

## What the canonical popover actually is

The popover header text is:

```
SERVICE · FACETED COUNTS
```

It is a **SERVICE** facet, not a status facet. It contains exactly three rows:

| Service | Count | Checkbox state |
|---|---|---|
| AI Automation | 21 | checked (`background:#2F7D4F`) |
| Workflow Automation | 17 | checked (`background:#2F7D4F`) |
| Web Applications | 14 | unchecked (`border:1.5px solid #B9C2C7`) |

Followed by a `Clear` action row.

The canonical frame defines **no status facet counts anywhere**. The `Status ▾` pill
at line 147 is rendered closed, so no status breakdown is visible in any captured frame.

## Related canonical header values

Line 143 (C-D05 header subtitle):

```
128 total · 12 new this week · 9 awaiting first contact
```

Line 148: `128 RESULTS`. Line 194: `1–10 OF 128`.

These describe a 128-row dataset. The mock serves 10 rows. They are therefore
illustrative of a populated production dataset and cannot be used as the mock
envelope's `total` without making the response internally inconsistent.

## Why this file exists

An earlier revision of `command-center/apps/web/mocks/handlers/leads.ts` returned an
eleven-entry `facetCounts` map keyed by **lead status**, commented as "the canonical
popover values." That was wrong in two independent ways:

1. **Misattribution.** The values 21 / 17 / 14 are canonical, but they are counts of
   *services* (AI Automation / Workflow Automation / Web Applications). They were
   relabelled as the *statuses* New / Contacted / Appt Pending.
2. **Fabrication.** The remaining eight values (12, 9, 11, 13, 8, 19, 7, 6) appear
   nowhere in the canonical source as facet counts. They were invented to fill out the
   status enum.

The resulting map summed to 137 against a claimed total of 128 — impossible for a
mutually exclusive breakdown, which is what exposed it.

Status facets are now derived from fixture rows by `computeStatusFacets()`. If a
service facet is implemented later, the three values above are the canonical display
reference, and they must be presented as design reference data — not returned from a
mock as if counted from records.
