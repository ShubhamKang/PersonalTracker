import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { GoalsModule } from './goals/goals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HabitsModule } from './habits/habits.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TodosModule,
    GoalsModule,
    DashboardModule,
    HabitsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
