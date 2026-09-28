import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, TodosModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
