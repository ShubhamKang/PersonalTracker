import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { GoalsService } from '../goals/goals.service';
import { HabitsService } from '../habits/habits.service';
import { todayDate, currentWeekKey, currentMonthKey, currentWeekDates } from '../common/date.util';
import { buildWeeklyReview, WeeklyReview } from './review-summary';

export interface DashboardSummary {
  date: string;
  weekKey: string;
  monthKey: string;
  todos: { total: number; done: number };
  habits: { total: number; done: number };
  weeklyGoals: { total: number; done: number };
  monthlyGoals: { total: number; done: number };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly goals: GoalsService,
    private readonly habits: HabitsService,
  ) {}

  async summary(userId: string): Promise<DashboardSummary> {
    const user = await this.users.findById(userId);
    const timezone = user?.timezone ?? 'Asia/Kolkata';
    const date = todayDate(timezone);

    // Today's todos.
    const todos = await this.prisma.dailyTodo.findMany({
      where: { userId, date },
      select: { done: true },
    });

    // Today's due habits (weekday-matched, with completion status).
    const dueHabits = await this.habits.dueToday(userId);

    // Goals via GoalsService so carry-over is applied consistently.
    const weekly = await this.goals.list(userId, 'WEEKLY');
    const monthly = await this.goals.list(userId, 'MONTHLY');

    const count = (arr: { done: boolean }[]) => ({
      total: arr.length,
      done: arr.filter((x) => x.done).length,
    });

    return {
      date,
      weekKey: currentWeekKey(timezone),
      monthKey: currentMonthKey(timezone),
      todos: count(todos),
      habits: count(dueHabits),
      weeklyGoals: count(weekly),
      monthlyGoals: count(monthly),
    };
  }

  /**
   * Weekly review: aggregates the current ISO week's todos, goals, and habit
   * completions into a single summary with an overall completion rate.
   */
  async review(userId: string): Promise<WeeklyReview> {
    const user = await this.users.findById(userId);
    const timezone = user?.timezone ?? 'Asia/Kolkata';
    const weekDates = currentWeekDates(timezone);

    // Todos that fall in this week.
    const todos = await this.prisma.dailyTodo.findMany({
      where: { userId, date: { in: weekDates } },
      select: { date: true, done: true },
    });

    // Goals (current period) via GoalsService so carry-over is applied.
    const weekly = await this.goals.list(userId, 'WEEKLY');
    const monthly = await this.goals.list(userId, 'MONTHLY');

    // All of the user's habit templates + their completion dates.
    const templates = await this.prisma.habitTemplate.findMany({
      where: { section: { userId } },
      select: {
        title: true,
        weekday: true,
        completions: { select: { date: true } },
      },
    });

    return buildWeeklyReview({
      weekDates,
      todos,
      weeklyGoals: weekly.map((g) => ({ done: g.done })),
      monthlyGoals: monthly.map((g) => ({ done: g.done })),
      habits: templates.map((t) => ({
        title: t.title,
        weekday: t.weekday,
        completionDates: t.completions.map((c) => c.date),
      })),
    });
  }
}
