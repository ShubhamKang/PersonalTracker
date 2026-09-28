import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';
import { todayDate } from '../common/date.util';
import { DailyTodo } from '@prisma/client';

@Injectable()
export class TodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private async userTimezone(userId: string): Promise<string> {
    const user = await this.users.findById(userId);
    return user?.timezone ?? 'Asia/Kolkata';
  }

  async listToday(userId: string): Promise<DailyTodo[]> {
    const date = todayDate(await this.userTimezone(userId));
    return this.prisma.dailyTodo.findMany({
      where: { userId, date },
      orderBy: { id: 'asc' },
    });
  }

  async create(userId: string, title: string): Promise<DailyTodo> {
    const date = todayDate(await this.userTimezone(userId));
    return this.prisma.dailyTodo.create({
      data: { userId, date, title },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { title?: string; done?: boolean },
  ): Promise<DailyTodo> {
    await this.assertOwned(userId, id);
    return this.prisma.dailyTodo.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    await this.prisma.dailyTodo.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const todo = await this.prisma.dailyTodo.findUnique({ where: { id } });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    if (todo.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
