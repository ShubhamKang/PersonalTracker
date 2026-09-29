import { DateTime } from 'luxon';
import { isReminderDue } from './reminder-window';

const TZ = 'Asia/Kolkata';

function at(hhmm: string): DateTime {
  const [h, m] = hhmm.split(':').map(Number);
  return DateTime.fromObject(
    { year: 2026, month: 9, day: 29, hour: h, minute: m },
    { zone: TZ },
  );
}

describe('isReminderDue', () => {
  it('is due exactly at the reminder time', () => {
    expect(isReminderDue('21:30', TZ, 15, at('21:30'))).toBe(true);
  });

  it('is due within the window after the reminder time', () => {
    expect(isReminderDue('21:30', TZ, 15, at('21:44'))).toBe(true);
  });

  it('is NOT due at the far edge of the window', () => {
    expect(isReminderDue('21:30', TZ, 15, at('21:45'))).toBe(false);
  });

  it('is NOT due before the reminder time', () => {
    expect(isReminderDue('21:30', TZ, 15, at('21:29'))).toBe(false);
  });

  it('is NOT due long after the reminder time', () => {
    expect(isReminderDue('21:30', TZ, 15, at('23:00'))).toBe(false);
  });

  it('respects timezone: 21:30 IST is due for an IST user at that instant', () => {
    // 21:30 IST == 16:00 UTC. Evaluate using a UTC "now" converted to IST.
    const nowUtc = DateTime.fromISO('2026-09-29T16:05:00', { zone: 'utc' });
    expect(isReminderDue('21:30', TZ, 15, nowUtc)).toBe(true);
  });

  it('returns false for invalid reminder time', () => {
    expect(isReminderDue('9pm', TZ, 15, at('21:30'))).toBe(false);
  });
});
