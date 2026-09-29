import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface UserDataExport {
  exportedAt: string; // ISO timestamp
  version: 1;
  user: {
    id: string;
    email: string;
    timezone: string;
    createdAt: string;
  };
  todos: Array<{ date: string; title: string; done: boolean }>;
  goals: Array<{
    scope: string;
    category: string;
    title: string;
    done: boolean;
    periodKey: string;
  }>;
  sections: Array<{
    name: string;
    notificationsEnabled: boolean;
    reminderTime: string | null;
    habits: Array<{
      title: string;
      weekday: number;
      completionDates: string[];
    }>;
  }>;
  notes: Array<{ title: string; content: string; pinned: boolean }>;
  devItems: Array<{
    type: string;
    title: string;
    progress: number;
    notes: string | null;
  }>;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Collect all of a user's data into a single, portable JSON structure.
   * IDs are omitted intentionally — this is a human-readable data dump, not a
   * re-import format. Only the requesting user's own rows are included.
   */
  async exportAll(userId: string): Promise<UserDataExport> {
    const [user, todos, goals, sections, notes, devItems] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.dailyTodo.findMany({
        where: { userId },
        select: { date: true, title: true, done: true },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.goal.findMany({
        where: { userId },
        select: {
          scope: true,
          category: true,
          title: true,
          done: true,
          periodKey: true,
        },
        orderBy: [{ periodKey: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.section.findMany({
        where: { userId },
        select: {
          name: true,
          notificationsEnabled: true,
          reminderTime: true,
          habits: {
            select: {
              title: true,
              weekday: true,
              completions: {
                select: { date: true },
                orderBy: { date: 'asc' },
              },
            },
            orderBy: [{ weekday: 'asc' }, { id: 'asc' }],
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.note.findMany({
        where: { userId },
        select: { title: true, content: true, pinned: true },
        orderBy: [{ pinned: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.devItem.findMany({
        where: { userId },
        select: { type: true, title: true, progress: true, notes: true },
        orderBy: [{ type: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      user: {
        id: user?.id ?? userId,
        email: user?.email ?? '',
        timezone: user?.timezone ?? '',
        createdAt: user?.createdAt.toISOString() ?? '',
      },
      todos,
      goals,
      sections: sections.map((s) => ({
        name: s.name,
        notificationsEnabled: s.notificationsEnabled,
        reminderTime: s.reminderTime,
        habits: s.habits.map((h) => ({
          title: h.title,
          weekday: h.weekday,
          completionDates: h.completions.map((c) => c.date),
        })),
      })),
      notes,
      devItems,
    };
  }
}
