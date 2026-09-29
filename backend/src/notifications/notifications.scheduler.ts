import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

// Must match the cron cadence below so the reminder "window" lines up.
export const WINDOW_MINUTES = 15;

// Every 15 minutes (at :00, :15, :30, :45). Explicit string avoids
// CronExpression enum mismatches across @nestjs/schedule + cron versions.
const EVERY_15_MIN = '0 */15 * * * *';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private running = false;

  constructor(private readonly notifications: NotificationsService) {}

  @Cron(EVERY_15_MIN)
  async handleCron(): Promise<void> {
    // Guard against overlapping runs if a cycle takes longer than the interval.
    if (this.running) {
      this.logger.warn('Previous notification run still in progress; skipping.');
      return;
    }
    this.running = true;
    try {
      const sent = await this.notifications.evaluateAll(WINDOW_MINUTES);
      if (sent > 0) {
        this.logger.log(`Notification sweep sent ${sent} message(s).`);
      }
    } catch (err) {
      this.logger.error('Notification sweep failed', err as Error);
    } finally {
      this.running = false;
    }
  }
}
