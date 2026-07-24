// Money for the proposal screens, handled in integer cents so a subtotal is exact and every entered
// amount is validated. Shared by the builder (editable line amounts) and the preview (read-only
// investment table) so there is one canonical formatter and one canonical total.

const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Seed proposal values are whole dollars (lib/demo/seed `value: 86400`). */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Format integer cents as USD. Whole-dollar amounts render without cents, matching the frames. */
export function formatUsd(cents: number): string {
  return cents % 100 === 0 ? usdWhole.format(cents / 100) : usdCents.format(cents / 100);
}

/**
 * Parse a user-entered amount into integer cents. Rejects everything that would corrupt a total:
 * empty, non-numeric, NaN, Infinity, negative, and more than two decimal places. Accepts an optional
 * thousands separator and a leading `$`.
 */
export function parseAmountToCents(input: string): { ok: true; cents: number } | { ok: false } {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (cleaned === "") return { ok: false };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  return { ok: true, cents: Math.round(value * 100) };
}

/** Sum of the parseable line amounts, in cents. Invalid lines are excluded, never coerced to 0-total. */
export function sumCents(amounts: readonly string[]): number {
  return amounts.reduce((total, raw) => {
    const parsed = parseAmountToCents(raw);
    return parsed.ok ? total + parsed.cents : total;
  }, 0);
}
