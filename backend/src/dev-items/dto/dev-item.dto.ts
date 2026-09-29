import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const DEV_ITEM_TYPES = ['PERSONALITY', 'SKILL'] as const;
export type DevItemType = (typeof DEV_ITEM_TYPES)[number];

export class CreateDevItemDto {
  @IsIn(DEV_ITEM_TYPES)
  type!: DevItemType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateDevItemDto {
  @IsOptional()
  @IsIn(DEV_ITEM_TYPES)
  type?: DevItemType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
