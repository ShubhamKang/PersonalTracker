import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { currentMonthKey, currentWeekKey } from '../common/date.util';
import { Goal } from '@prisma/client';
import { GoalCategory, GoalScope } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private async userTimezone(userId: string): Promise<string> {
    const user = await this.users.findById(userId);
    return user?.timezone ?? 'Asia/Kolkata';
  }

  private periodKeyFor(scope: GoalScope, timezone: string): string {
    return scope === 'WEEKLY'
      ? currentWeekKey(timezone)
      : currentMonthKey(timezone);
  }

  /**
   * Lists goals for the given scope in the current period.
   * Carry-over: any INCOMPLETE goals whose periodKey is a PAST period are
   * rolled forward to the current periodKey before returning. Completed goals
   * stay in their original period (they don't reappear).
   */
  async list(userId: string, scope: GoalScope): Promise<Goal[]> {
    const timezone = await this.userTimezone(userId);
    const currentKey = this.periodKeyFor(scope, timezone);

    // Roll forward incomplete goals from earlier periods.
    await this.prisma.goal.updateMany({
      where: {
        userId,
        scope,
        done: false,
        periodKey: { lt: currentKey },
      },
      data: { periodKey: currentKey },
    });

    return this.prisma.goal.findMany({
      where: { userId, scope, periodKey: currentKey },
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
    });
  }

  async create(
    userId: string,
    scope: GoalScope,
    category: GoalCategory,
    title: string,
  ): Promise<Goal> {
    const timezone = await this.userTimezone(userId);
    const periodKey = this.periodKeyFor(scope, timezone);
    return this.prisma.goal.create({
      data: { userId, scope, category, title, periodKey },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { title?: string; done?: boolean; category?: GoalCategory },
  ): Promise<Goal> {
    await this.assertOwned(userId, id);
    return this.prisma.goal.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    await this.prisma.goal.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
