import { PrismaClient } from "@prisma/client";
import { IFindAllOptions } from "../../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../../core/interfaces/Common/IPaginatedResult";
import { ICommentRepository } from "../../../core/interfaces/Repositories/ICommentRepository";
import { Comment } from "../../../domain/entities/Comment";
import { CommentStatus } from "../../../domain/enums/CommentStatus";
import { BaseRepository } from "./core/BaseRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../core/container/types";

@injectable()
export class CommentRepository extends BaseRepository<Comment> implements ICommentRepository {
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
        },
      },
      blogPost: {
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true,
        },
      },
    };
  }

  private getFullIncludeOptions() {
    return {
      ...this.getIncludeOptions(),
      parent: {
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
      },
      replies: {
        where: { 
          isActive: true,
          status: CommentStatus.APPROVED
        },
        include: this.getIncludeOptions(),
        orderBy: { createdAt: 'asc' },
        take: 10,
      },
      _count: {
        select: { 
          replies: {
            where: {
              isActive: true,
              status: CommentStatus.APPROVED
            }
          }
        },
      },
    };
  }

  async findById(id: string): Promise<Comment | null> {
    try {
      return await this.prisma.comment.findUnique({
        where: { id },
        include: this.getFullIncludeOptions(),
      });
    } catch (error) {
      console.error('Error finding comment by ID:', error);
      return null;
    }
  }

  async findAll(options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const { page = 1, limit = 20, sortBy, sortOrder = 'desc', filters = {} } = options;
    const { skip, take } = this.buildSkipTake(page, limit);

    const where = {
      isActive: true,
      ...filters,
    };

    try {
      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({
          where,
          skip,
          take,
          orderBy: this.buildOrderBy(sortBy || 'createdAt', sortOrder),
          include: this.getIncludeOptions(),
        }),
        this.prisma.comment.count({ where }),
      ]);

      return {
        data: comments,
        pagination: this.buildPagination(page, limit, total),
      };
    } catch (error) {
      console.error('Error finding all comments:', error);
      return {
        data: [],
        pagination: this.buildPagination(page, limit, 0),
      };
    }
  }

  async create(commentData: Partial<Comment>): Promise<Comment> {
    try {
      const created = await this.prisma.comment.create({
        data: {
          content: commentData.content!,
          authorId: commentData.authorId!,
          blogPostId: commentData.blogPostId!,
          parentId: commentData.parentId || null,
          status: commentData.status || CommentStatus.PENDING,
          isActive: commentData.isActive !== false,
          createdAt: commentData.createdAt || new Date(),
          updatedAt: commentData.updatedAt || new Date(),
        },
        include: this.getIncludeOptions(),
      });

      return await this.findById(created.id) || created;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  async update(id: string, commentData: Partial<Comment>): Promise<Comment> {
    try {
      const updateData: any = {
        ...commentData,
        updatedAt: new Date(),
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await this.prisma.comment.update({
        where: { id },
        data: updateData,
      });

      return await this.findById(id) || {} as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.comment.update({
        where: { id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error soft deleting comment:', error);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!comment;
    } catch (error) {
      console.error('Error checking comment existence:', error);
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      await this.prisma.comment.updateMany({
        where: { parentId: id },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await this.prisma.comment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error hard deleting comment:', error);
      return false;
    }
  }

  async findByBlogPost(blogPostId: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        blogPostId,
        parentId: null,
        status: CommentStatus.APPROVED,
        isActive: true,
      },
    };

    return await this.findAll(searchOptions);
  }

  async findByAuthor(authorId: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        authorId,
        isActive: true,
      },
    };

    return await this.findAll(searchOptions);
  }

  async findPending(options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        status: CommentStatus.PENDING,
        isActive: true,
      },
    };

    return await this.findAll(searchOptions);
  }

  async findByStatus(status: CommentStatus, options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        status,
        isActive: true,
      },
    };

    return await this.findAll(searchOptions);
  }

  async searchComments(query: string, options: IFindAllOptions = {}): Promise<IPaginatedResult<Comment>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        OR: [
          {
            content: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          {
            author: {
              username: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
          },
        ],
        isActive: true,
      },
    };

    return await this.findAll(searchOptions);
  }

  async approveComment(id: string): Promise<Comment> {
    try {
      await this.prisma.comment.update({
        where: { id },
        data: { 
          status: CommentStatus.APPROVED,
          updatedAt: new Date(),
        },
      });

      return await this.findById(id) || {} as Comment;
    } catch (error) {
      console.error('Error approving comment:', error);
      throw new Error('Failed to approve comment');
    }
  }

  async rejectComment(id: string): Promise<Comment> {
    try {
      await this.prisma.comment.update({
        where: { id },
        data: { 
          status: CommentStatus.REJECTED,
          updatedAt: new Date(),
        },
      });

      return await this.findById(id) || {} as Comment;
    } catch (error) {
      console.error('Error rejecting comment:', error);
      throw new Error('Failed to reject comment');
    }
  }

  async bulkApprove(ids: string[]): Promise<number> {
    try {
      const result = await this.prisma.comment.updateMany({
        where: { 
          id: { in: ids },
          status: { not: CommentStatus.APPROVED },
          isActive: true,
        },
        data: { 
          status: CommentStatus.APPROVED,
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk approving comments:', error);
      return 0;
    }
  }

  async bulkReject(ids: string[]): Promise<number> {
    try {
      const result = await this.prisma.comment.updateMany({
        where: { 
          id: { in: ids },
          status: { not: CommentStatus.REJECTED },
          isActive: true,
        },
        data: { 
          status: CommentStatus.REJECTED,
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk rejecting comments:', error);
      return 0;
    }
  }

  async bulkDelete(ids: string[]): Promise<number> {
    try {
      const result = await this.prisma.comment.updateMany({
        where: { 
          id: { in: ids },
          isActive: true,
        },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk deleting comments:', error);
      return 0;
    }
  }

  async findCommentsNeedingReview(): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          OR: [
            { status: CommentStatus.PENDING },
            { 
              content: { 
                contains: 'http'
              }
            },
          ],
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
        include: this.getIncludeOptions(),
        take: 100,
      });
    } catch (error) {
      console.error('Error finding comments needing review:', error);
      return [];
    }
  }

  async findSuspiciousComments(): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          OR: [
            { 
              content: { 
                contains: 'http',
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: 'aaaa',
                mode: 'insensitive'
              }
            },
          ],
          status: CommentStatus.PENDING,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        include: this.getIncludeOptions(),
        take: 50,
      });
    } catch (error) {
      console.error('Error finding suspicious comments:', error);
      return [];
    }
  }

  async getCommentStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    inactive: number;
    totalReplies: number;
  }> {
    try {
      const [total, pending, approved, rejected, inactive, totalReplies] = await Promise.all([
        this.prisma.comment.count({ where: { isActive: true } }),
        this.prisma.comment.count({ where: { status: CommentStatus.PENDING, isActive: true } }),
        this.prisma.comment.count({ where: { status: CommentStatus.APPROVED, isActive: true } }),
        this.prisma.comment.count({ where: { status: CommentStatus.REJECTED, isActive: true } }),
        this.prisma.comment.count({ where: { isActive: false } }),
        this.prisma.comment.count({ where: { parentId: { not: null }, isActive: true } }),
      ]);

      return { total, pending, approved, rejected, inactive, totalReplies };
    } catch (error) {
      console.error('Error getting comment stats:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0, inactive: 0, totalReplies: 0 };
    }
  }

  async getRecentComments(limit: number = 10): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          isActive: true,
          status: CommentStatus.APPROVED,
        },
        take: Math.min(limit, 50),
        orderBy: { createdAt: 'desc' },
        include: this.getIncludeOptions(),
      });
    } catch (error) {
      console.error('Error getting recent comments:', error);
      return [];
    }
  }

  async getCommentsByDateRange(startDate: Date, endDate: Date): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: this.getIncludeOptions(),
        take: 1000,
      });
    } catch (error) {
      console.error('Error getting comments by date range:', error);
      return [];
    }
  }

  async countCommentsByBlogPost(blogPostId: string): Promise<number> {
    try {
      return await this.prisma.comment.count({
        where: {
          blogPostId,
          isActive: true,
          status: CommentStatus.APPROVED,
        },
      });
    } catch (error) {
      console.error('Error counting comments by blog post:', error);
      return 0;
    }
  }

  async getTopCommentedPosts(limit: number = 10): Promise<Array<{
    blogPostId: string;
    _count: { id: number };
  }>> {
    try {
      const result = await this.prisma.comment.groupBy({
        by: ['blogPostId'],
        where: {
          isActive: true,
          status: CommentStatus.APPROVED,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: Math.min(limit, 50),
      });

      return result;
    } catch (error) {
      console.error('Error getting top commented posts:', error);
      return [];
    }
  }

  async getCommentTrends(days: number = 30): Promise<Array<{
    date: string;
    count: number;
    status: CommentStatus;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          status
        FROM Comment 
        WHERE createdAt >= ${startDate}
          AND isActive = true
        GROUP BY DATE(createdAt), status
        ORDER BY date DESC
      `;
    } catch (error) {
      console.error('Error getting comment trends:', error);
      return [];
    }
  }

  async getMostActiveCommenters(limit: number = 10): Promise<Array<{
    authorId: string;
    _count: { id: number };
  }>> {
    try {
      return await this.prisma.comment.groupBy({
        by: ['authorId'],
        where: {
          isActive: true,
          status: CommentStatus.APPROVED,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: Math.min(limit, 50),
      });
    } catch (error) {
      console.error('Error getting most active commenters:', error);
      return [];
    }
  }

  async getCommentEngagementStats(): Promise<{
    averageCommentsPerPost: number;
    averageRepliesPerComment: number;
    engagementRate: number;
  }> {
    try {
      const [
        totalPosts,
        totalComments,
        totalReplies,
        totalTopLevelComments
      ] = await Promise.all([
        this.prisma.blogPost.count({ where: { isPublished: true } }),
        this.prisma.comment.count({ 
          where: { 
            isActive: true, 
            status: CommentStatus.APPROVED 
          } 
        }),
        this.prisma.comment.count({ 
          where: { 
            parentId: { not: null },
            isActive: true, 
            status: CommentStatus.APPROVED 
          } 
        }),
        this.prisma.comment.count({ 
          where: { 
            parentId: null,
            isActive: true, 
            status: CommentStatus.APPROVED 
          } 
        }),
      ]);

      const averageCommentsPerPost = totalPosts > 0 
        ? Math.round((totalComments / totalPosts) * 100) / 100 
        : 0;

      const averageRepliesPerComment = totalTopLevelComments > 0 
        ? Math.round((totalReplies / totalTopLevelComments) * 100) / 100 
        : 0;

      const engagementRate = totalPosts > 0 
        ? Math.round(((totalComments + totalReplies) / totalPosts) * 100) / 100 
        : 0;

      return {
        averageCommentsPerPost,
        averageRepliesPerComment,
        engagementRate,
      };
    } catch (error) {
      console.error('Error getting comment engagement stats:', error);
      return {
        averageCommentsPerPost: 0,
        averageRepliesPerComment: 0,
        engagementRate: 0,
      };
    }
  }

  async cleanupOldRejectedComments(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.comment.updateMany({
        where: {
          status: CommentStatus.REJECTED,
          updatedAt: {
            lt: cutoffDate,
          },
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old rejected comments:', error);
      return 0;
    }
  }

  async getOrphanedComments(): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          OR: [
            {
              parentId: { not: null },
              parent: null,
            },
            {
              blogPost: null,
            },
          ],
          isActive: true,
        },
        include: this.getIncludeOptions(),
      });
    } catch (error) {
      console.error('Error finding orphaned comments:', error);
      return [];
    }
  }
}