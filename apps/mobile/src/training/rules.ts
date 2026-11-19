// Pure date / time rules for the training tools. No React, no I/O — fully unit-tested (rules.test.ts).
//
// SEMETRA ONLY. Pen presentations differ between semaglutide brands (for example Semetra's 1.5 ml starter pen
// is 1.34 mg/ml, whereas other brands use different strengths and dose-delivery systems). Nothing here may be
// reused for another product, and no other product's figures may be copied in.

export const HOUR_MS = 3_600_000;
/** "Five days or less after the due day" (guide p.14), applied as exactly 5 × 24 h, boundary inclusive. */
export const TAKE_WINDOW_HOURS = 120;
/** One scheduled interval. */
export const WEEK_HOURS = 168;
/** Two scheduled doses have been reached without an injection. */
export const TWO_WEEKS_HOURS = 336;

export type MissedOutcome =
  /** The scheduled time has not arrived yet. */
  | 'beforeDue'
  /** It is exactly the scheduled moment. */
  | 'dueNow'
  /** Guide: five days or fewer → use it as soon as you remember, then keep the usual day. */
  | 'take'
  /** Guide: more than five days → skip it, then keep the usual day. */
  | 'skip'
  /** The next scheduled dose time has arrived → resume the usual schedule (no catch-up, no double dose). */
  | 'resume'
  /** More than one scheduled dose has passed. ADDED safety guidance (not in the leaflet): ask the clinician. */
  | 'multiple';

export interface MissedDecision {
  outcome: MissedOutcome;
  /** Exact elapsed time since the scheduled dose, in hours (can be fractional or negative). */
  hours: number;
  /** Whole days and remaining whole hours, for display. Both 0 when negative. */
  days: number;
  remHours: number;
}

/**
 * Decide what the guide says to do, from two real instants (epoch ms): when the dose was due and when the
 * user remembers it. Uses exact elapsed time, so months, years, leap days and daylight-saving changes cannot
 * shift the answer. Exactly 120 h counts as "within five days".
 */
export function missedDoseDecision(dueMs: number, rememberedMs: number): MissedDecision {
  const diff = rememberedMs - dueMs; // integer ms: compare in ms to avoid floating-point edge cases
  const hours = diff / HOUR_MS;
  const whole = Math.max(0, Math.floor(diff / HOUR_MS));
  const base = { hours, days: Math.floor(whole / 24), remHours: whole % 24 };

  let outcome: MissedOutcome;
  if (diff < 0) outcome = 'beforeDue';
  else if (diff === 0) outcome = 'dueNow';
  else if (diff <= TAKE_WINDOW_HOURS * HOUR_MS) outcome = 'take';
  else if (diff < WEEK_HOURS * HOUR_MS) outcome = 'skip';
  else if (diff < TWO_WEEKS_HOURS * HOUR_MS) outcome = 'resume';
  else outcome = 'multiple';
  return { outcome, ...base };
}

// ---------------------------------------------------------------------------------------------------------
// In-use period and expiry (guide p.16). Calendar dates are 'YYYY-MM-DD' strings; arithmetic is done on
// calendar fields, never by adding milliseconds, so daylight-saving changes cannot move a date.

export const IN_USE_WEEKS = 8;
/** 8 weeks = 56 days counted with the day of first use as day 1 (the conservative reading), i.e. first use + 55 days. */
export const IN_USE_LAST_DAY_OFFSET = IN_USE_WEEKS * 7 - 1;

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
export function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Add calendar days to an ISO date (negative allowed). */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(y, m - 1, d + days); // local calendar arithmetic, not ms
  return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** Whole calendar days from `fromISO` to `toISO_` (negative if later). Uses UTC midnights, so DST cannot add or drop a day. */
export function daysBetween(fromISO: string, toISO_: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO_);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** The printed expiry (month + year) runs to the LAST day of that month. */
export function expiryLastDay(year: number, month: number): string {
  return toISO(year, month, new Date(year, month, 0).getDate());
}

export interface UseLimit {
  /** The last calendar day the pen may be used: the earlier of the in-use limit and the expiry day. */
  lastDay: string;
  /** Which rule sets `lastDay`. */
  limitedBy: 'inUse' | 'expiry' | 'both';
  inUseLastDay: string;
  expiryDay: string | null;
}

export function useLimit(firstUse: string, expiry?: { year: number; month: number } | null): UseLimit {
  const inUseLastDay = addDays(firstUse, IN_USE_LAST_DAY_OFFSET);
  const expiryDay = expiry ? expiryLastDay(expiry.year, expiry.month) : null;
  if (!expiryDay) return { lastDay: inUseLastDay, limitedBy: 'inUse', inUseLastDay, expiryDay };
  if (expiryDay < inUseLastDay) return { lastDay: expiryDay, limitedBy: 'expiry', inUseLastDay, expiryDay };
  if (expiryDay === inUseLastDay) return { lastDay: inUseLastDay, limitedBy: 'both', inUseLastDay, expiryDay };
  return { lastDay: inUseLastDay, limitedBy: 'inUse', inUseLastDay, expiryDay };
}

export type UseStatus = 'pastLimit' | 'lastDay' | 'withinPeriod';

/** Where `today` falls against the limit. "withinPeriod" is NOT a safety statement: storage history still matters. */
export function useStatus(limit: UseLimit, today: string): { status: UseStatus; daysLeft: number } {
  const daysLeft = daysBetween(today, limit.lastDay);
  if (daysLeft < 0) return { status: 'pastLimit', daysLeft };
  if (daysLeft === 0) return { status: 'lastDay', daysLeft };
  return { status: 'withinPeriod', daysLeft };
}

// ---------------------------------------------------------------------------------------------------------
// Temperature. A reading cannot show that medicine froze, so the app never "declares" a pen frozen from a
// number. It only reports whether a reading is inside the labelled range.

export type TempZone = 'belowRange' | 'fridge' | 'inUseRoom' | 'aboveRange';

/** Labelled ranges (guide p.16): unopened 2–8 °C; in use 2–8 °C or below 30 °C (up to the in-use period). */
export function tempZone(celsius: number, inUse: boolean): TempZone {
  if (celsius < 2) return 'belowRange';
  if (celsius <= 8) return 'fridge';
  if (inUse && celsius <= 30) return 'inUseRoom';
  return 'aboveRange';
}
