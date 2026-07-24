// Calendar arithmetic for the Appointments route.
//
// Everything here is pure and UTC-based. Two reasons: the demo dataset pins a fixed
// reference day (DEMO_TODAY) so a demo replays identically, and reading local time would
// make a date chip render one day earlier for a viewer west of UTC — the canonical frames
// show "TODAY 22" and that has to stay 22 everywhere.

const MS_PER_DAY = 86_400_000;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function toUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, delta: number): string {
  return toIso(new Date(toUtc(iso).getTime() + delta * MS_PER_DAY));
}

export function addMonths(iso: string, delta: number): string {
  const date = toUtc(iso);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
  // Clamp the day so 31 March minus one month is 28/29 February rather than rolling over.
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return toIso(target);
}

/** MO-07 1143: "TUE / 22". */
export function weekdayLabel(iso: string): string {
  return WEEKDAYS[toUtc(iso).getUTCDay()]!;
}

export function dayNumber(iso: string): string {
  return String(toUtc(iso).getUTCDate());
}

/** C-D11 334: the date chip reads "APR / 21" unless the day is today, which reads "TODAY". */
export function monthShort(iso: string): string {
  return MONTHS_SHORT[toUtc(iso).getUTCMonth()]!;
}

export function monthTitle(iso: string): string {
  const date = toUtc(iso);
  return `${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Wednesday, April 22" — the accessible name of a calendar day and the list day heading. */
export function longDate(iso: string): string {
  const date = toUtc(iso);
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getUTCDay()]!;
  return `${weekday}, ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** Six Sunday-started weeks covering the month `iso` falls in. Always six rows so the grid
 *  does not change height as the month changes. */
export function monthGrid(iso: string): string[][] {
  const date = toUtc(iso);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const start = toIso(new Date(first.getTime() - first.getUTCDay() * MS_PER_DAY));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

function meridiem(time: string): "AM" | "PM" {
  return Number(time.slice(0, 2)) >= 12 ? "PM" : "AM";
}

function twelveHour(time: string): string {
  const hour = Number(time.slice(0, 2));
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${time.slice(3, 5)}`;
}

/** C-D11 321: "10:00–10:45 AM PST". One meridiem when the range does not cross noon, two
 *  when it does — "11:30 AM–12:15 PM PST" would otherwise read as an 11:30 PM meeting. */
export function timeRange(start: string, end: string, timezone: string): string {
  const startMeridiem = meridiem(start);
  const endMeridiem = meridiem(end);
  return startMeridiem === endMeridiem
    ? `${twelveHour(start)}–${twelveHour(end)} ${endMeridiem} ${timezone}`
    : `${twelveHour(start)} ${startMeridiem}–${twelveHour(end)} ${endMeridiem} ${timezone}`;
}

/** Sort key: a day plus a 24-hour start time already sorts lexicographically. */
export function chronological(a: { date: string; startTime: string }, b: { date: string; startTime: string }): number {
  return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`);
}
