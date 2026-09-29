import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Note } from '@prisma/client';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pinned first, then most recently created (cuid is roughly time-ordered). */
  list(userId: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: [{ pinned: 'desc' }, { id: 'desc' }],
    });
  }

  create(userId: string, dto: CreateNoteDto): Promise<Note> {
    return this.prisma.note.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content ?? '',
        pinned: dto.pinned ?? false,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
  ): Promise<Note> {
    await this.assertOwned(userId, id);
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
