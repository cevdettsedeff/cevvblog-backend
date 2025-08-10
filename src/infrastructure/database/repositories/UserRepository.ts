import { PrismaClient } from "@prisma/client";
import { IUserRepository } from "../../../core/interfaces/Repositories/IUserRepository ";
import { User } from "../../../domain/entities/User";
import { BaseRepository } from "./core/BaseRepository";
import { TYPES } from "../../../core/container/types";
import { inject, injectable } from "inversify";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";

@injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            blogPosts: true,
            comments: true,
          },
        },
      },
    });
  }

  async findAll(options: IFindAllOptions = {}): Promise<IPaginatedResult<User>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', filters = {} } = options;
    const { skip, take } = this.buildSkipTake(page, limit);

    const where = {
      isActive: true,
      ...filters,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              blogPosts: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users as User[],
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async create(userData: Partial<User>): Promise<User> {
    return await this.prisma.user.create({
      data: userData as any,
      include: {
        _count: {
          select: {
            blogPosts: true,
            comments: true,
          },
        },
      },
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        updatedAt: new Date(),
      } as any,
      include: {
        _count: {
          select: {
            blogPosts: true,
            comments: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Soft delete - mark as inactive
      await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
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

  async findAuthors(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        role: { in: ['AUTHOR', 'ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: { blogPosts: true },
        },
      },
    }) as User[];
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    }) as User[];
  }
}