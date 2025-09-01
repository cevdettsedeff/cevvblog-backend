import { PrismaClient, User, RefreshToken, TokenBlacklist } from "@prisma/client";
import { UserRole } from "../../../domain/enums/UserRole";
import { inject, injectable } from "inversify";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";
import logger from "../../../utils/logger";
import { IUserRepository } from "../../../core/interfaces/Repositories/IUserRepository";
import { TYPES } from "../../../core/container/types";

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient 
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findAll(options?: IFindAllOptions): Promise<IPaginatedResult<User>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = options?.sortBy || "createdAt";
    const sortOrder = options?.sortOrder || "desc";

    // Filters
    const whereClause: any = {
      isActive: true,
      ...options?.filters,
    };

    // Include relations
    const include = options?.include || {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include,
      }),
      this.prisma.user.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async create(userData: Partial<User>): Promise<User> {
    return await this.prisma.user.create({
      data: userData as any,
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: { ...userData, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  async findAuthors(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.AUTHOR, UserRole.ADMIN] },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  // Refresh Token metodları
  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: {
        ...data,
        revoked: false,
      },
    });
  }

  async findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { token },
        data: { revoked: true },
      });
    } catch {
      logger.warn(`Attempted to revoke non-existent refresh token: ${token}`);
    }
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async cleanupExpiredRefreshTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
      },
    });
  }

  // Blacklist metodları
  async createBlacklistedToken(data: {
    token: string;
    userId?: string | null;
    expiresAt: Date;
  }): Promise<TokenBlacklist> {
    return await this.prisma.tokenBlacklist.create({ data });
  }

  async findBlacklistedToken(token: string): Promise<TokenBlacklist | null> {
    return await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });
  }

  async cleanupExpiredBlacklistedToken(tokenId: string): Promise<void> {
    try {
      await this.prisma.tokenBlacklist.delete({
        where: { id: tokenId },
      });
    } catch {
      logger.warn(`Attempted to delete non-existent blacklisted token with ID: ${tokenId}`);
    }
  }

  async cleanupExpiredBlacklistedTokens(): Promise<void> {
    await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.findBlacklistedToken(token);
    return !!blacklistedToken;
  }
}
