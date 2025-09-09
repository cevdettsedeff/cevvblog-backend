// src/infrastructure/database/repositories/CategoryRepository.ts

import { PrismaClient } from "@prisma/client";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";
import { Category } from "../../../domain/entities/Category";
import { BaseRepository } from "./core/BaseRepository";
import { ICategoryRepository } from "../../../core/interfaces/Repositories/ICategoryRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../core/container/types";

// Prisma return type helper
type PrismaCategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    blogPosts: number;
  };
};

@injectable()
export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma);
  }

  // Helper method to convert Prisma result to Category interface
  private mapPrismaToCategory(prismaCategory: PrismaCategoryWithCount): Category {
    return {
      id: prismaCategory.id,
      name: prismaCategory.name,
      slug: prismaCategory.slug,
      description: prismaCategory.description,
      color: prismaCategory.color,
      icon: prismaCategory.icon,
      isActive: prismaCategory.isActive,
      sortOrder: prismaCategory.sortOrder,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
      _count: prismaCategory._count,
    };
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const result = await this.prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      });

      return result ? this.mapPrismaToCategory(result) : null;
    } catch (error) {
      console.error("CategoryRepository.findById error:", error);
      return null;
    }
  }

  async findAll(options: IFindAllOptions = {}): Promise<IPaginatedResult<Category>> {
    try {
      const { page = 1, limit = 50, sortBy = "sortOrder", sortOrder = "asc", filters = {} } = options;

      // Validate inputs
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100);

      const { skip, take } = this.buildSkipTake(validPage, validLimit);

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
              select: {
                blogPosts: {
                  where: {
                    isPublished: true,
                    status: "PUBLISHED",
                  },
                },
              },
            },
          },
        }),
        this.prisma.category.count({ where }),
      ]);

      return {
        data: categories.map((cat) => this.mapPrismaToCategory(cat)),
        pagination: this.buildPagination(validPage, validLimit, total),
      };
    } catch (error) {
      console.error("CategoryRepository.findAll error:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  async create(categoryData: Partial<Category>): Promise<Category> {
    try {
      // Get the highest sort order
      const maxSortOrder = await this.prisma.category.aggregate({
        _max: {
          sortOrder: true,
        },
      });

      const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

      const result = await this.prisma.category.create({
        data: {
          name: categoryData.name!,
          slug: categoryData.slug!,
          description: categoryData.description || null,
          color: categoryData.color || null,
          icon: categoryData.icon || null,
          sortOrder: categoryData.sortOrder || nextSortOrder,
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      });

      return this.mapPrismaToCategory(result);
    } catch (error) {
      console.error("CategoryRepository.create error:", error);
      throw new Error("Failed to create category");
    }
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category> {
    try {
      const updateData: any = {};

      // Only include defined fields
      if (categoryData.name !== undefined) updateData.name = categoryData.name;
      if (categoryData.slug !== undefined) updateData.slug = categoryData.slug;
      if (categoryData.description !== undefined) updateData.description = categoryData.description;
      if (categoryData.color !== undefined) updateData.color = categoryData.color;
      if (categoryData.icon !== undefined) updateData.icon = categoryData.icon;
      if (categoryData.isActive !== undefined) updateData.isActive = categoryData.isActive;
      if (categoryData.sortOrder !== undefined) updateData.sortOrder = categoryData.sortOrder;

      updateData.updatedAt = new Date();

      const result = await this.prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      });

      return this.mapPrismaToCategory(result);
    } catch (error) {
      console.error("CategoryRepository.update error:", error);
      throw new Error("Failed to update category");
    }
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
    } catch (error) {
      console.error("CategoryRepository.delete error:", error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!category;
    } catch (error) {
      console.error("CategoryRepository.exists error:", error);
      return false;
    }
  }

  async findBySlug(slug: string): Promise<Category | null> {
    try {
      const result = await this.prisma.category.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      });

      return result ? this.mapPrismaToCategory(result) : null;
    } catch (error) {
      console.error("CategoryRepository.findBySlug error:", error);
      return null;
    }
  }

  async findActive(): Promise<Category[]> {
    try {
      const results = await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      });

      return results.map((result) => this.mapPrismaToCategory(result));
    } catch (error) {
      console.error("CategoryRepository.findActive error:", error);
      return [];
    }
  }

  async updateSortOrder(categoryId: string, sortOrder: number): Promise<void> {
    try {
      await this.prisma.category.update({
        where: { id: categoryId },
        data: {
          sortOrder,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("CategoryRepository.updateSortOrder error:", error);
      throw new Error("Failed to update sort order");
    }
  }

  async findWithPostCount(): Promise<Category[]> {
    try {
      const results = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      return results.map((result) => this.mapPrismaToCategory(result));
    } catch (error) {
      console.error("CategoryRepository.findWithPostCount error:", error);
      return [];
    }
  }

  async findPopular(limit: number): Promise<Category[]> {
    try {
      const results = await this.prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              blogPosts: {
                where: {
                  isPublished: true,
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
        orderBy: [
          {
            blogPosts: {
              _count: "desc", // En çok post'a sahip kategoriler önce
            },
          },
          {
            sortOrder: "asc", // Eşit post sayısında sortOrder'a göre
          },
        ],
        take: Math.min(Math.max(1, limit), 50), // 1-50 arası limit
      });

      return results.map((result) => this.mapPrismaToCategory(result));
    } catch (error) {
      console.error("CategoryRepository.findPopular error:", error);
      return [];
    }
  }

  async getCategoryCounts(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const [totalCount, activeCount] = await Promise.all([
        this.prisma.category.count(),
        this.prisma.category.count({
          where: { isActive: true },
        }),
      ]);

      return {
        total: totalCount,
        active: activeCount,
        inactive: totalCount - activeCount,
      };
    } catch (error) {
      console.error("CategoryRepository.getCategoryCounts error:", error);
      throw new Error("Failed to get category counts");
    }
  }
}
