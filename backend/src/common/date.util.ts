import { DateTime } from 'luxon';

const DEFAULT_TZ = 'Asia/Kolkata';

function nowInZone(timezone?: string): DateTime {
  const dt = DateTime.now().setZone(timezone || DEFAULT_TZ);
  // If the timezone is invalid, Luxon returns an invalid DateTime; fall back.
  return dt.isValid ? dt : DateTime.now().setZone(DEFAULT_TZ);
}

/** Current local date as "YYYY-MM-DD" in the user's timezone. */
export function todayDate(timezone?: string): string {
  return nowInZone(timezone).toFormat('yyyy-MM-dd');
}

/** ISO week key like "2026-W40" in the user's timezone. */
export function currentWeekKey(timezone?: string): string {
  const dt = nowInZone(timezone);
  const week = String(dt.weekNumber).padStart(2, '0');
  return `${dt.weekYear}-W${week}`;
}

/** Month key like "2026-09" in the user's timezone. */
export function currentMonthKey(timezone?: string): string {
  return nowInZone(timezone).toFormat('yyyy-MM');
}

/** ISO weekday 1=Mon .. 7=Sun in the user's timezone. */
export function currentWeekday(timezone?: string): number {
  return nowInZone(timezone).weekday;
}

/**
 * The seven local dates ("YYYY-MM-DD") of the current ISO week (Mon..Sun)
 * in the user's timezone. Used by the weekly review aggregation.
 */
export function currentWeekDates(timezone?: string): string[] {
  const monday = nowInZone(timezone).startOf('week'); // Luxon: Monday
  return Array.from({ length: 7 }, (_, i) =>
    monday.plus({ days: i }).toFormat('yyyy-MM-dd'),
  );
}
