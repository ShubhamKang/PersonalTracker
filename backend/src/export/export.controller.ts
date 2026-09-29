import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { ExportService, UserDataExport } from './export.service';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // Suggest a filename so browser/app clients can save the dump directly.
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="personal-tracker-export.json"')
  export(@CurrentUser() user: AuthUser): Promise<UserDataExport> {
    return this.exportService.exportAll(user.userId);
  }
}
