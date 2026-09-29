import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DevItem } from '@prisma/client';
import {
  CreateDevItemDto,
  DevItemType,
  UpdateDevItemDto,
} from './dto/dev-item.dto';

@Injectable()
export class DevItemsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, type?: DevItemType): Promise<DevItem[]> {
    return this.prisma.devItem.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { id: 'asc' },
    });
  }

  create(userId: string, dto: CreateDevItemDto): Promise<DevItem> {
    return this.prisma.devItem.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        progress: dto.progress ?? 0,
        notes: dto.notes ?? null,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDevItemDto,
  ): Promise<DevItem> {
    await this.assertOwned(userId, id);
    return this.prisma.devItem.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    await this.assertOwned(userId, id);
    await this.prisma.devItem.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const item = await this.prisma.devItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Dev item not found');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
