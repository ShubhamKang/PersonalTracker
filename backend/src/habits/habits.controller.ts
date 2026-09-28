import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { SectionsService } from './sections.service';
import { HabitsService } from './habits.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  CreateHabitDto,
  UpdateHabitDto,
} from './dto/habit.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class HabitsController {
  constructor(
    private readonly sections: SectionsService,
    private readonly habits: HabitsService,
  ) {}

  // --- Sections ---
  @Get('sections')
  listSections(@CurrentUser() user: AuthUser) {
    return this.sections.list(user.userId);
  }

  @Post('sections')
  createSection(@CurrentUser() user: AuthUser, @Body() dto: CreateSectionDto) {
    return this.sections.create(user.userId, dto.name);
  }

  @Patch('sections/:id')
  updateSection(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sections.update(user.userId, id, dto);
  }

  @Delete('sections/:id')
  removeSection(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sections.remove(user.userId, id);
  }

  // --- Habit templates ---
  @Get('habits/today')
  dueToday(@CurrentUser() user: AuthUser) {
    return this.habits.dueToday(user.userId);
  }

  @Post('sections/:id/habits')
  createHabit(
    @CurrentUser() user: AuthUser,
    @Param('id') sectionId: string,
    @Body() dto: CreateHabitDto,
  ) {
    return this.habits.createInSection(
      user.userId,
      sectionId,
      dto.title,
      dto.weekday,
    );
  }

  @Patch('habits/:id')
  updateHabit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habits.update(user.userId, id, dto);
  }

  @Delete('habits/:id')
  removeHabit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.habits.remove(user.userId, id);
  }

  @Post('habits/:id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.habits.complete(user.userId, id);
  }

  @Delete('habits/:id/complete')
  uncomplete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.habits.uncomplete(user.userId, id);
  }
}
