import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from './current-user.decorator';
import {
  SignupDto,
  LoginDto,
  GoogleAuthDto,
  PushTokenDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto.email, dto.password, dto.timezone);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.loginWithGoogle(dto.idToken, dto.timezone);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findById(current.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() current: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    // Validate the IANA timezone using Luxon before persisting.
    if (!DateTime.now().setZone(dto.timezone).isValid) {
      throw new BadRequestException('Invalid timezone');
    }
    const user = await this.users.updateTimezone(current.userId, dto.timezone);
    return this.toProfile(user);
  }

  private toProfile(user: {
    id: string;
    email: string;
    timezone: string;
    passwordHash: string | null;
    googleId: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      hasPassword: user.passwordHash !== null,
      googleLinked: user.googleId !== null,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  pushToken(@CurrentUser() current: AuthUser, @Body() dto: PushTokenDto) {
    return this.auth.registerPushToken(current.userId, dto.token, dto.platform);
  }
}
