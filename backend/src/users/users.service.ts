import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  createLocalUser(data: {
    email: string;
    passwordHash: string;
    timezone: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  createGoogleUser(data: {
    email: string;
    googleId: string;
    timezone: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  linkGoogleId(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId },
    });
  }

  updateTimezone(userId: string, timezone: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });
  }
}
