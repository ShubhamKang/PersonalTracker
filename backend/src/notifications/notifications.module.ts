import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { HabitsModule } from '../habits/habits.module';
import { ExpoPushTransport, PUSH_TRANSPORT } from './push.transport';

@Module({
  imports: [HabitsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PrismaService,
    UsersService,
    { provide: PUSH_TRANSPORT, useClass: ExpoPushTransport },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
