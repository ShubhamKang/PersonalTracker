import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { GoalsService } from '../goals/goals.service';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [HabitsModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, UsersService, GoalsService],
})
export class DashboardModule {}
