import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  // "HH:mm" 24h, e.g. "21:30". Nullable to clear.
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'reminderTime must be "HH:mm"',
  })
  reminderTime?: string;
}

export class CreateHabitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  // ISO weekday: 1=Mon .. 7=Sun
  @IsInt()
  @Min(1)
  @Max(7)
  weekday!: number;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;
}
