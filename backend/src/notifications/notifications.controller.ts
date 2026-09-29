import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { DateTime } from 'luxon';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * Manually trigger a notification evaluation for the current user,
   * ignoring the time window and dedupe. Returns the messages that would be
   * sent — useful for testing without waiting for the scheduler.
   */
  @Post('test')
  async test(@CurrentUser() user: AuthUser) {
    const messages = await this.notifications.evaluateUser(
      user.userId,
      15,
      DateTime.now(),
      { ignoreWindow: true, ignoreDedupe: true },
    );
    return { count: messages.length, messages };
  }
}
