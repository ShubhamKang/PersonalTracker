import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SectionsService } from './sections.service';
import { HabitTemplate } from '@prisma/client';

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sections: SectionsService,
  ) {}

  async createInSection(
    userId: string,
    sectionId: string,
    title: string,
    weekday: number,
  ): Promise<HabitTemplate> {
    await this.sections.assertOwned(userId, sectionId);
    return this.prisma.habitTemplate.create({
      data: { sectionId, title, weekday },
    });
  }

  async update(
    userId: string,
    habitId: string,
    data: { title?: string; weekday?: number },
  ): Promise<HabitTemplate> {
    await this.assertOwnedHabit(userId, habitId);
    return this.prisma.habitTemplate.update({ where: { id: habitId }, data });
  }

  async remove(userId: string, habitId: string): Promise<{ ok: true }> {
    await this.assertOwnedHabit(userId, habitId);
    await this.prisma.habitTemplate.delete({ where: { id: habitId } });
    return { ok: true };
  }

  private async assertOwnedHabit(
    userId: string,
    habitId: string,
  ): Promise<HabitTemplate> {
    const habit = await this.prisma.habitTemplate.findUnique({
      where: { id: habitId },
      include: { section: true },
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    if (habit.section.userId !== userId) {
      throw new ForbiddenException();
    }
    return habit;
  }
}
