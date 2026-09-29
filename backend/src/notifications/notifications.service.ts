import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { HabitsService } from '../habits/habits.service';
import { UsersService } from '../users/users.service';
import { currentWeekday, todayDate } from '../common/date.util';
import { DateTime } from 'luxon';
import { buildMissedMessage } from './message-builder';
import { PushMessage, PushTransport, PUSH_TRANSPORT } from './push.transport';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly habits: HabitsService,
    private readonly users: UsersService,
    @Inject(PUSH_TRANSPORT) private readonly transport: PushTransport,
  ) {}

  /**
   * True if the section's reminderTime falls within the window
   * (windowStart, now] in the user's timezone — i.e. it just became due.
   * windowMinutes should match the scheduler cadence.
   */
  private isReminderDue(
    reminderTime: string,
    timezone: string,
    windowMinutes: number,
    now: DateTime = DateTime.now(),
  ): boolean {
    const local = now.setZone(timezone);
    const [h, m] = reminderTime.split(':').map((x) => parseInt(x, 10));
    const reminder = local.set({
      hour: h,
      minute: m,
      second: 0,
      millisecond: 0,
    });
    const diffMin = local.diff(reminder, 'minutes').minutes;
    return diffMin >= 0 && diffMin < windowMinutes;
  }

  /**
   * Evaluate one user's notification-enabled sections and send reminders for
   * those whose reminder time is due, listing only incomplete habits.
   * Deduped per section per day via NotificationLog.
   * Returns the messages that were sent (useful for tests/among logs).
   */
  async evaluateUser(
    userId: string,
    windowMinutes: number,
    now: DateTime = DateTime.now(),
    opts: { ignoreWindow?: boolean; ignoreDedupe?: boolean } = {},
  ): Promise<PushMessage[]> {
    const user = await this.users.findById(userId);
    if (!user) {
      return [];
    }
    const timezone = user.timezone;
    const date = todayDate(timezone);
    const weekday = currentWeekday(timezone);

    const sections = await this.prisma.section.findMany({
      where: { userId, notificationsEnabled: true, reminderTime: { not: null } },
      include: {
        habits: {
          where: { weekday },
          include: { completions: { where: { date } } },
        },
      },
    });

    // Push tokens for this user.
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    const toSend: PushMessage[] = [];

    for (const section of sections) {
      if (!section.reminderTime) {
        continue;
      }
      const due =
        opts.ignoreWindow ||
        this.isReminderDue(section.reminderTime, timezone, windowMinutes, now);
      if (!due) {
        continue;
      }
      if (section.habits.length === 0) {
        continue; // nothing scheduled today for this section
      }

      // Dedupe: one notification per section per day.
      if (!opts.ignoreDedupe) {
        const already = await this.prisma.notificationLog.findUnique({
          where: { sectionId_date: { sectionId: section.id, date } },
        });
        if (already) {
          continue;
        }
      }

      const message = buildMissedMessage(
        section.name,
        section.habits.map((h) => ({
          title: h.title,
          done: h.completions.length > 0,
        })),
      );
      if (!message) {
        continue; // all done -> silent
      }

      // Record dedupe marker (best-effort).
      if (!opts.ignoreDedupe) {
        await this.prisma.notificationLog
          .create({ data: { sectionId: section.id, date } })
          .catch(() => undefined);
      }

      for (const { token } of tokens) {
        toSend.push({ to: token, title: message.title, body: message.body });
      }
    }

    if (toSend.length > 0) {
      await this.transport.send(toSend);
      this.logger.log(
        `Sent ${toSend.length} notification(s) for user ${userId}`,
      );
    }
    return toSend;
  }

  /** Evaluate all users (called by the scheduler). */
  async evaluateAll(windowMinutes: number): Promise<number> {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    let total = 0;
    for (const u of users) {
      const sent = await this.evaluateUser(u.id, windowMinutes);
      total += sent.length;
    }
    return total;
  }
}
