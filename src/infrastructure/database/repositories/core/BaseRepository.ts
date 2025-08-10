// Base Repository (infrastructure/database/repositories/BaseRepository.ts)
import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IFindAllOptions } from '../../../../core/interfaces/Common/IFindAllOptions';
import { IPaginatedResult } from '../../../../core/interfaces/Common/IPaginatedResult';
import { IRepository } from '../../../../core/interfaces/IRepository';

@injectable()
export abstract class BaseRepository<T> implements IRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(options?: IFindAllOptions): Promise<IPaginatedResult<T>>;
  abstract create(entity: Partial<T>): Promise<T>;
  abstract update(id: string, entity: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
  abstract exists(id: string): Promise<boolean>;

  protected buildPagination(page: number = 1, limit: number = 10, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  protected buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return { createdAt: sortOrder };
    return { [sortBy]: sortOrder };
  }

  protected buildSkipTake(page: number = 1, limit: number = 10) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}