import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { GoalsService } from '../goals/goals.service';
import { HabitsService } from '../habits/habits.service';
import { todayDate, currentWeekKey, currentMonthKey } from '../common/date.util';

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
}
