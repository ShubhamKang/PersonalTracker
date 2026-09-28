import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Section, HabitTemplate } from '@prisma/client';

export type SectionWithHabits = Section & { habits: HabitTemplate[] };

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<SectionWithHabits[]> {
    return this.prisma.section.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { habits: { orderBy: [{ weekday: 'asc' }, { id: 'asc' }] } },
    });
  }

  create(userId: string, name: string): Promise<Section> {
    return this.prisma.section.create({ data: { userId, name } });
  }

  async update(
    userId: string,
    id: string,
    data: {
      name?: string;
      notificationsEnabled?: boolean;
      reminderTime?: string;
    },
  ): Promise<Section> {
    await this.assertOwned(userId, id);
    return this.prisma.section.update({ where: { id }, data });
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    // Cascade deletes habits + completions (per schema onDelete: Cascade).
    await this.prisma.section.delete({ where: { id } });
    return { ok: true };
  }

  async assertOwned(userId: string, id: string): Promise<Section> {
    const section = await this.prisma.section.findUnique({ where: { id } });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    if (section.userId !== userId) {
      throw new ForbiddenException();
    }
    return section;
  }
}
