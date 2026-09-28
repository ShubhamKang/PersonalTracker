import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  // IANA timezone, e.g. "Asia/Kolkata". Optional; defaults server-side.
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class GoogleAuthDto {
  // Google ID token obtained on the mobile client.
  @IsString()
  idToken!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class PushTokenDto {
  @IsString()
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}
