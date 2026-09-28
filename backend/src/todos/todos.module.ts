import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { PrismaService } from '../common/prisma.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService, PrismaService, UsersService],
})
export class TodosModule {}
