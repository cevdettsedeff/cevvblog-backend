import { PrismaClient } from "@prisma/client";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";
import { Category } from "../../../domain/entities/Category";
import { BaseRepository } from "./core/BaseRepository";
import { ICategoryRepository } from "../../../core/interfaces/Repositories/ICategoryRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../core/container/types";

@injectable()
export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { blogPosts: true },
        },
      },
    });
  }

  async findAll(options: IFindAllOptions = {}): Promise<IPaginatedResult<Category>> {
    const { page = 1, limit = 50, sortBy = 'sortOrder', sortOrder = 'asc', filters = {} } = options;
    const { skip, take } = this.buildSkipTake(page, limit);

    const where = {
      ...filters,
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        include: {
          _count: {
            select: { blogPosts: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async create(categoryData: Partial<Category>): Promise<Category> {
    return await this.prisma.category.create({
      data: categoryData as any,
      include: {
        _count: {
          select: { blogPosts: true },
        },
      },
    });
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category> {
    return await this.prisma.category.update({
      where: { id },
      data: {
        ...categoryData,
        updatedAt: new Date(),
      } as any,
      include: {
        _count: {
          select: { blogPosts: true },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Check if category has blog posts
      const postsCount = await this.prisma.blogPost.count({
        where: { categoryId: id },
      });

      if (postsCount > 0) {
        // Soft delete - mark as inactive
        await this.prisma.category.update({
          where: { id },
          data: { 
            isActive: false,
            updatedAt: new Date(),
          },
        });
      } else {
        // Hard delete if no posts
        await this.prisma.category.delete({
          where: { id },
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { blogPosts: true },
        },
      },
    });
  }

  async findActive(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { blogPosts: true },
        },
      },
    });
  }

  async updateSortOrder(categoryId: string, sortOrder: number): Promise<void> {
    await this.prisma.category.update({
      where: { id: categoryId },
      data: { 
        sortOrder,
        updatedAt: new Date(),
      },
    });
  }

  async findWithPostCount(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { 
            blogPosts: {
              where: {
                isPublished: true,
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}