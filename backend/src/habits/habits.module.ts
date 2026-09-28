import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { SectionsService } from './sections.service';
import { HabitsService } from './habits.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [HabitsController],
  providers: [SectionsService, HabitsService, PrismaService, UsersService],
  exports: [SectionsService, HabitsService],
})
export class HabitsModule {}
