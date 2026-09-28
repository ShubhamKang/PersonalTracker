import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from './current-user.decorator';
import {
  SignupDto,
  LoginDto,
  GoogleAuthDto,
  PushTokenDto,
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
