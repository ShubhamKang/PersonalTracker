import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { GoalsService } from '../goals/goals.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, UsersService, GoalsService],
})
export class DashboardModule {}
