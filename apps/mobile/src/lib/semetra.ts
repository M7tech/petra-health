import type { Medication, Pen, TitrationWeek, UserMedication } from '@/types';

export const dayKey = (iso: string) => iso.slice(0, 10);

export const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0); // noon UTC avoids tz date-shift
  return d;
};

// Course week at which each pen starts, per the Semetra patient guide:
// pen 1 = weeks 1–6, pen 2 = weeks 7–10 (7–8 if stepping up), 3 ml pen = from week 9.
export const COURSE_OFFSET: Record<number, number> = { 1: 0, 2: 6, 3: 8 };

/** What the doctor decided after week 8 — continue 0.5 mg, or step up to 1 mg. */
export type After8 = '0.5' | '1';
export const AFTER8_KEY = 'petra_semetra_after8';

export interface ScheduledWeek {
  week: TitrationWeek;
  date: Date;
  courseWeek: number;
}
export interface PenBlock {
  pen: Pen;
  weeks: ScheduledWeek[];
}

export function buildSchedule(catalog: Medication | null, mine: UserMedication | null, after8: After8): PenBlock[] {
  if (!catalog || !mine) return [];
  const start = new Date(mine.startDate);
  const pens = catalog.pens
    .filter((p) => p.sequence >= mine.startPenSequence)
    // The 3 ml / 1 mg pen is only part of the course on the 1 mg path.
    .filter((p) => p.sequence !== 3 || after8 === '1')
    .sort((a, b) => a.sequence - b.sequence);
  let g = 0;
  return pens.map((pen) => {
    // On the 1 mg path the second 1.5 ml pen is only used for weeks 7–8.
    const weeks = pen.sequence === 2 && after8 === '1' ? pen.weeks.slice(0, 2) : pen.weeks;
    const offset = COURSE_OFFSET[pen.sequence] ?? 0;
    return {
      pen,
      weeks: weeks.map((w) => {
        const date = addDays(start, g * 7);
        g += 1;
        return { week: w, date, courseWeek: offset + w.weekNumber };
      }),
    };
  });
}
