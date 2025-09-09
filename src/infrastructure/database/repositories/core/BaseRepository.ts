// src/infrastructure/database/repositories/core/BaseRepository.ts

import { PrismaClient } from "@prisma/client";
import { IPaginatedResult } from "../../../../core/interfaces/Common/IPaginatedResult";
import { IPagination } from "../../../../core/interfaces/Common/IPagination";

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected buildSkipTake(page: number, limit: number): { skip: number; take: number } {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  protected buildPagination(page: number, limit: number, total: number): IPagination {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
    };
  }

  protected buildOrderBy(sortBy: string, sortOrder: string): any {
    return {
      [sortBy]: sortOrder,
    };
  }

  // Abstract methods
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(options?: any): Promise<IPaginatedResult<T>>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
  abstract exists(id: string): Promise<boolean>;
}