import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { SectionsService } from './sections.service';
import { HabitsService } from './habits.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [HabitsController],
  providers: [SectionsService, HabitsService, PrismaService],
  exports: [SectionsService, HabitsService],
})
export class HabitsModule {}
