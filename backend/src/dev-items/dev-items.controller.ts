import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { DevItemsService } from './dev-items.service';
import {
  CreateDevItemDto,
  DevItemType,
  UpdateDevItemDto,
} from './dto/dev-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('dev-items')
export class DevItemsController {
  constructor(private readonly devItems: DevItemsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('type') type?: DevItemType) {
    return this.devItems.list(user.userId, type);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDevItemDto) {
    return this.devItems.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDevItemDto,
  ) {
    return this.devItems.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.devItems.remove(user.userId, id);
  }
}
