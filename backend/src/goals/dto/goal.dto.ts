import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const GOAL_SCOPES = ['WEEKLY', 'MONTHLY'] as const;
export const GOAL_CATEGORIES = ['STUDY', 'OTHER'] as const;

export type GoalScope = (typeof GOAL_SCOPES)[number];
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export class CreateGoalDto {
  @IsIn(GOAL_SCOPES)
  scope!: GoalScope;

  @IsIn(GOAL_CATEGORIES)
  category!: GoalCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsIn(GOAL_CATEGORIES)
  category?: GoalCategory;
}
