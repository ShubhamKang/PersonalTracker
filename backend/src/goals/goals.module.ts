import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, PrismaService, UsersService],
})
export class GoalsModule {}
