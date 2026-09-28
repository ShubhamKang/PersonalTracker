import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/prisma.service';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; timezone: string };
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async signup(
    email: string,
    password: string,
    timezone?: string,
  ): Promise<AuthResult> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.createLocalUser({
      email,
      passwordHash,
      timezone: timezone ?? DEFAULT_TIMEZONE,
    });
    return this.buildResult(user.id, user.email, user.timezone);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildResult(user.id, user.email, user.timezone);
  }

  async loginWithGoogle(
    idToken: string,
    timezone?: string,
  ): Promise<AuthResult> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google sign-in is not configured');
    }
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    // Existing Google user?
    let user = await this.users.findByGoogleId(payload.sub);
    if (!user) {
      // Existing local user with same email -> link the Google id.
      const byEmail = await this.users.findByEmail(payload.email);
      if (byEmail) {
        user = await this.users.linkGoogleId(byEmail.id, payload.sub);
      } else {
        user = await this.users.createGoogleUser({
          email: payload.email,
          googleId: payload.sub,
          timezone: timezone ?? DEFAULT_TIMEZONE,
        });
      }
    }
    return this.buildResult(user.id, user.email, user.timezone);
  }

  async registerPushToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<{ ok: true }> {
    // Upsert by unique token; move token to this user if it already exists.
    await this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
    return { ok: true };
  }

  private buildResult(
    id: string,
    email: string,
    timezone: string,
  ): AuthResult {
    const accessToken = this.jwt.sign({ sub: id, email });
    return { accessToken, user: { id, email, timezone } };
  }
}
