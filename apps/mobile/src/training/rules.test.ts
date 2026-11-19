// @ts-nocheck — run with Node's built-in runner: `npm run test:training` (not part of the app bundle).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUR_MS, missedDoseDecision, addDays, daysBetween, expiryLastDay, useLimit, useStatus, tempZone,
} from './rules.ts';

// Real local dates and times. The decision uses exact elapsed time, so the same instants must give the same
// answer in every time zone and across daylight-saving changes.
const at = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
const outcome = (due, now) => missedDoseDecision(due, now).outcome;

// Reviewer table: dose due on a MONDAY (2026-11-16 09:00 local).
const DUE = at(2026, 11, 16, 9, 0);

test('Monday dose: remembered Tuesday–Saturday within 5 days → take', () => {
  assert.equal(outcome(DUE, at(2026, 11, 17, 9, 0)), 'take'); // Tue
  assert.equal(outcome(DUE, at(2026, 11, 18, 21, 30)), 'take'); // Wed
  assert.equal(outcome(DUE, at(2026, 11, 19, 8, 0)), 'take'); // Thu
  assert.equal(outcome(DUE, at(2026, 11, 20, 23, 59)), 'take'); // Fri
  assert.equal(outcome(DUE, at(2026, 11, 21, 8, 59)), 'take'); // Sat, just before 120 h
});

test('exactly 120 hours is part of the five-day boundary → take; one minute later → skip', () => {
  const exactly120 = DUE + 120 * HOUR_MS; // Saturday 2026-11-21 09:00
  assert.equal(outcome(DUE, exactly120), 'take');
  assert.equal(missedDoseDecision(DUE, exactly120).hours, 120);
  assert.equal(outcome(DUE, exactly120 + 60_000), 'skip');
  assert.equal(outcome(DUE, exactly120 + 1), 'skip'); // even one millisecond over
});

test('Monday dose: Sunday (more than 5 days) → skip', () => {
  assert.equal(outcome(DUE, at(2026, 11, 22, 9, 0)), 'skip'); // Sun, 144 h
  assert.equal(outcome(DUE, at(2026, 11, 22, 23, 59)), 'skip');
  assert.equal(outcome(DUE, at(2026, 11, 23, 8, 59)), 'skip'); // Mon, 1 minute before next dose
});

test('following Monday → resume the usual schedule (never a double dose)', () => {
  assert.equal(outcome(DUE, at(2026, 11, 23, 9, 0)), 'resume'); // exactly 168 h
  assert.equal(outcome(DUE, at(2026, 11, 24, 9, 0)), 'resume');
});

test('before the due time and exactly at it', () => {
  assert.equal(outcome(DUE, DUE - 1), 'beforeDue');
  assert.equal(outcome(DUE, DUE), 'dueNow');
  assert.equal(outcome(DUE, DUE + 1), 'take');
});

test('two or more scheduled doses passed → multiple (added clinician-contact guidance)', () => {
  assert.equal(outcome(DUE, DUE + 335 * HOUR_MS), 'resume');
  assert.equal(outcome(DUE, DUE + 336 * HOUR_MS), 'multiple'); // exactly 14 days
  assert.equal(outcome(DUE, at(2027, 1, 20, 9, 0)), 'multiple');
});

test('month and year boundaries use real elapsed time', () => {
  const dueNYE = at(2026, 12, 29, 10, 0); // Tuesday
  assert.equal(outcome(dueNYE, at(2027, 1, 3, 10, 0)), 'take'); // exactly 120 h, across the new year
  assert.equal(outcome(dueNYE, at(2027, 1, 3, 10, 1)), 'skip');
  const dueLeap = at(2028, 2, 26, 8, 0); // leap year: Feb 29 exists
  assert.equal(outcome(dueLeap, at(2028, 3, 2, 8, 0)), 'take'); // 26→27→28→29→Mar 1→Mar 2 = 5 days
  assert.equal(outcome(dueLeap, at(2028, 3, 2, 8, 1)), 'skip');
  const dueNonLeap = at(2027, 2, 26, 8, 0);
  assert.equal(outcome(dueNonLeap, at(2027, 3, 3, 8, 0)), 'take'); // 26,27,28,Mar1,2,3 = 5 days
});

test('daylight-saving change: the answer follows elapsed hours, not wall-clock days', () => {
  // Fixed instants (UTC) so this test is identical in any machine time zone: 120 h apart exactly.
  const due = Date.UTC(2026, 2, 7, 14, 0); // 2026-03-07 14:00 UTC (US DST starts the next day)
  assert.equal(outcome(due, due + 120 * HOUR_MS), 'take');
  assert.equal(outcome(due, due + 120 * HOUR_MS + 1), 'skip');
});

test('decision reports whole days and hours for display', () => {
  const d = missedDoseDecision(DUE, DUE + (3 * 24 + 5) * HOUR_MS + 59 * 60_000);
  assert.deepEqual([d.days, d.remHours, d.outcome], [3, 5, 'take']);
});

// ---- in-use period and expiry ------------------------------------------------------------------------
test('in-use limit: 8 weeks counted with the first-use day as day 1', () => {
  assert.equal(useLimit('2026-01-01').inUseLastDay, '2026-02-25'); // 56th day
  assert.equal(useLimit('2026-01-01').lastDay, '2026-02-25');
  assert.equal(useLimit('2027-12-31').lastDay, '2028-02-24'); // across new year and a leap February
});

test('expiry is the LAST day of the printed month and wins when earlier', () => {
  assert.equal(expiryLastDay(2028, 2), '2028-02-29'); // leap
  assert.equal(expiryLastDay(2027, 2), '2027-02-28');
  assert.equal(expiryLastDay(2026, 12), '2026-12-31');
  const l = useLimit('2026-01-01', { year: 2026, month: 2 }); // expires 2026-02-28, in-use would run to 02-25
  assert.equal(l.lastDay, '2026-02-25');
  assert.equal(l.limitedBy, 'inUse');
  const e = useLimit('2026-01-20', { year: 2026, month: 2 }); // in-use would run to 03-16; expiry 02-28 is earlier
  assert.equal(e.lastDay, '2026-02-28');
  assert.equal(e.limitedBy, 'expiry');
  assert.equal(useLimit('2026-01-01', { year: 2026, month: 2 }).expiryDay, '2026-02-28');
});

test('use status never says "safe": only past / last day / within the maximum period', () => {
  const lim = useLimit('2026-01-01');
  assert.equal(useStatus(lim, '2026-02-24').status, 'withinPeriod');
  assert.deepEqual(useStatus(lim, '2026-02-25'), { status: 'lastDay', daysLeft: 0 });
  assert.equal(useStatus(lim, '2026-02-26').status, 'pastLimit');
});

test('calendar day maths is immune to daylight-saving shifts', () => {
  assert.equal(daysBetween('2026-03-01', '2026-03-15'), 14); // spans US DST start
  assert.equal(daysBetween('2026-10-20', '2026-11-05'), 16); // spans US DST end
  assert.equal(addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(addDays('2026-10-31', 2), '2026-11-02');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2027-02-28', 1), '2027-03-01');
});

// ---- temperature -------------------------------------------------------------------------------------
test('temperature zones report the labelled range; a reading below range is never called "frozen"', () => {
  assert.equal(tempZone(-5, false), 'belowRange');
  assert.equal(tempZone(1.9, true), 'belowRange');
  assert.equal(tempZone(2, false), 'fridge');
  assert.equal(tempZone(8, false), 'fridge');
  assert.equal(tempZone(8.1, false), 'aboveRange'); // unopened: outside the labelled range
  assert.equal(tempZone(25, true), 'inUseRoom'); // in use: below 30 °C is labelled
  assert.equal(tempZone(30, true), 'inUseRoom');
  assert.equal(tempZone(30.1, true), 'aboveRange');
  assert.ok(!['frozen'].includes(tempZone(-20, true)));
});
