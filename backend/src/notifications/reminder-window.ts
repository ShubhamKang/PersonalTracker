import { DateTime } from 'luxon';

/**
 * True if `reminderTime` ("HH:mm") falls within the window (reminder, reminder+windowMinutes]
 * relative to `now`, evaluated in the given timezone. In other words, the
 * reminder time has just passed within the last `windowMinutes`.
 */
export function isReminderDue(
  reminderTime: string,
  timezone: string,
  windowMinutes: number,
  now: DateTime = DateTime.now(),
): boolean {
  const local = now.setZone(timezone);
  if (!local.isValid) {
    return false;
  }
  const [h, m] = reminderTime.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return false;
  }
  const reminder = local.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  const diffMin = local.diff(reminder, 'minutes').minutes;
  return diffMin >= 0 && diffMin < windowMinutes;
}
