import { PrismaClient } from "@prisma/client";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";
import { BlogPost } from "../../../domain/entities/BlogPost";
import { BaseRepository } from "./core/BaseRepository";
import { IBlogPostRepository } from "../../../core/interfaces/Repositories/IBlogPostRepository";
import { TYPES } from "../../../core/container/types";
import { inject, injectable } from "inversify";

@injectable()
export class BlogPostRepository extends BaseRepository<BlogPost> implements IBlogPostRepository {
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma);
  }

  private getIncludeOptions() {
    return {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          icon: true,
        },
      },
      _count: {
        select: { 
          comments: {
            where: {
              status: 'APPROVED',
              isActive: true,
            },
          },
        },
      },
    };
  }

  async findById(id: string): Promise<BlogPost | null> {
    return await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        ...this.getIncludeOptions(),
        comments: {
          where: { 
            status: 'APPROVED', 
            isActive: true,
            parentId: null, // Only top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            replies: {
              where: { 
                status: 'APPROVED', 
                isActive: true,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Limit initial comments
        },
      },
    });
  }

  async findAll(options: IFindAllOptions = {}): Promise<IPaginatedResult<BlogPost>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', filters = {} } = options;
    const { skip, take } = this.buildSkipTake(page, limit);

    const where = {
      ...filters,
    };

    const [blogPosts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        include: this.getIncludeOptions(),
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: blogPosts,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async create(postData: Partial<BlogPost>): Promise<BlogPost> {
    return await this.prisma.blogPost.create({
      data: postData as any,
      include: this.getIncludeOptions(),
    });
  }

  async update(id: string, postData: Partial<BlogPost>): Promise<BlogPost> {
    return await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...postData,
        updatedAt: new Date(),
      } as any,
      include: this.getIncludeOptions(),
    });
  }

  async exists(id: string): Promise<boolean> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!post;
  }


  async findPublished(options: IFindAllOptions = {}): Promise<IPaginatedResult<BlogPost>> {
    return await this.findAll({
      ...options,
      filters: {
        ...options.filters,
        isPublished: true,
        status: 'PUBLISHED',
      },
    });
  }

  async findByCategory(categoryId: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<BlogPost>> {
    return await this.findAll({
      ...options,
      filters: {
        ...options.filters,
        categoryId,
        isPublished: true,
        status: 'PUBLISHED',
      },
    });
  }

  async findByAuthor(authorId: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<BlogPost>> {
    return await this.findAll({
      ...options,
      filters: {
        ...options.filters,
        authorId,
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.blogPost.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });
  }

  async findPopular(limit: number = 10): Promise<BlogPost[]> {
    return await this.prisma.blogPost.findMany({
      where: {
        isPublished: true,
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: this.getIncludeOptions(),
    });
  }

  async findRecent(limit: number = 10): Promise<BlogPost[]> {
    return await this.prisma.blogPost.findMany({
      where: {
        isPublished: true,
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: this.getIncludeOptions(),
    });
  }

  async findByTag(tag: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<BlogPost>> {
    return await this.findAll({
      ...options,
      filters: {
        ...options.filters,
        tags: { has: tag },
        isPublished: true,
        status: 'PUBLISHED',
      },
    });
  }

  async findDrafts(authorId?: string): Promise<BlogPost[]> {
    const where: any = {
      status: 'DRAFT',
    };

    if (authorId) {
      where.authorId = authorId;
    }

    return await this.prisma.blogPost.findMany({
      where,
      include: this.getIncludeOptions(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findTrending(limit: number = 10, days: number = 7): Promise<BlogPost[]> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return await this.prisma.blogPost.findMany({
      where: {
        isPublished: true,
        status: 'PUBLISHED',
        publishedAt: {
          gte: dateThreshold,
        },
      },
      take: limit,
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: this.getIncludeOptions(),
    });
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    return await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        ...this.getIncludeOptions(),
        comments: {
          where: { 
            status: 'APPROVED', 
            isActive: true,
            parentId: null,
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            replies: {
              where: { 
                status: 'APPROVED', 
                isActive: true,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      // First, soft delete related comments to maintain referential integrity
      await this.prisma.comment.updateMany({
        where: { postId: id },
        data: { isActive: false }
      });

      // Then delete the blog post
      await this.prisma.blogPost.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  }
}