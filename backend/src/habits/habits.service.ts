import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SectionsService } from './sections.service';
import { HabitTemplate } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { currentWeekday, todayDate } from '../common/date.util';
import { DateTime } from 'luxon';

export interface DueHabit {
  id: string;
  sectionId: string;
  sectionName: string;
  title: string;
  weekday: number;
  done: boolean;
  streak: number;
}

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sections: SectionsService,
    private readonly users: UsersService,
  ) {}

  private async userTimezone(userId: string): Promise<string> {
    const user = await this.users.findById(userId);
    return user?.timezone ?? 'Asia/Kolkata';
  }

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

  /**
   * Habits due on the current weekday (user timezone), each annotated with
   * whether it's completed today and its current streak. This is the
   * auto-recurrence core: templates are matched to today's weekday on the
   * fly, so the same weekday's habits reappear every week automatically.
   */
  async dueToday(userId: string): Promise<DueHabit[]> {
    const timezone = await this.userTimezone(userId);
    const weekday = currentWeekday(timezone);
    const date = todayDate(timezone);

    const templates = await this.prisma.habitTemplate.findMany({
      where: { weekday, section: { userId } },
      include: { section: true },
      orderBy: [{ section: { name: 'asc' } }, { id: 'asc' }],
    });

    if (templates.length === 0) {
      return [];
    }

    const ids = templates.map((t) => t.id);
    const todaysCompletions = await this.prisma.habitCompletion.findMany({
      where: { habitTemplateId: { in: ids }, date },
      select: { habitTemplateId: true },
    });
    const doneSet = new Set(todaysCompletions.map((c) => c.habitTemplateId));

    const result: DueHabit[] = [];
    for (const t of templates) {
      result.push({
        id: t.id,
        sectionId: t.sectionId,
        sectionName: t.section.name,
        title: t.title,
        weekday: t.weekday,
        done: doneSet.has(t.id),
        streak: await this.computeStreak(t.id, t.weekday, timezone),
      });
    }
    return result;
  }

  async complete(userId: string, habitId: string): Promise<{ ok: true }> {
    await this.assertOwnedHabit(userId, habitId);
    const date = todayDate(await this.userTimezone(userId));
    await this.prisma.habitCompletion.upsert({
      where: { habitTemplateId_date: { habitTemplateId: habitId, date } },
      update: {},
      create: { habitTemplateId: habitId, date },
    });
    return { ok: true };
  }

  async uncomplete(userId: string, habitId: string): Promise<{ ok: true }> {
    await this.assertOwnedHabit(userId, habitId);
    const date = todayDate(await this.userTimezone(userId));
    await this.prisma.habitCompletion.deleteMany({
      where: { habitTemplateId: habitId, date },
    });
    return { ok: true };
  }

  /**
   * Streak = number of consecutive scheduled occurrences (this weekday,
   * going back week by week) that were completed, ending at the most recent
   * past-or-present occurrence. If today is scheduled but not yet done, the
   * streak counts completed prior weeks (today doesn't break it).
   */
  private async computeStreak(
    habitId: string,
    weekday: number,
    timezone: string,
  ): Promise<number> {
    const completions = await this.prisma.habitCompletion.findMany({
      where: { habitTemplateId: habitId },
      select: { date: true },
    });
    const doneDates = new Set(completions.map((c) => c.date));

    // Start from the most recent occurrence of this weekday (today or past).
    let cursor = DateTime.now().setZone(timezone).startOf('day');
    // Move cursor back to the latest date whose weekday matches.
    const diff = (cursor.weekday - weekday + 7) % 7;
    cursor = cursor.minus({ days: diff });

    let streak = 0;
    // If the most recent occurrence is today and not done, skip today and
    // start counting from last week (today hasn't broken the streak yet).
    const todayStr = DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd');
    if (cursor.toFormat('yyyy-MM-dd') === todayStr && !doneDates.has(todayStr)) {
      cursor = cursor.minus({ weeks: 1 });
    }

    while (doneDates.has(cursor.toFormat('yyyy-MM-dd'))) {
      streak += 1;
      cursor = cursor.minus({ weeks: 1 });
    }
    return streak;
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
