import { Module } from '@nestjs/common';
import { DevItemsController } from './dev-items.controller';
import { DevItemsService } from './dev-items.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [DevItemsController],
  providers: [DevItemsService, PrismaService],
})
export class DevItemsModule {}
