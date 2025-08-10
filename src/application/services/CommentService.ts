import { injectable, inject } from "inversify";
import { IFindAllOptions } from "../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../core/interfaces/Common/IPaginatedResult";
import { IBlogPostRepository } from "../../core/interfaces/Repositories/IBlogPostRepository";
import { ICommentRepository } from "../../core/interfaces/Repositories/ICommentRepository";
import { ICommentService } from "../../core/interfaces/Services/ICommentService";
import { CommentStatus } from "../../domain/enums/CommentStatus";
import { Comment } from "../../domain/entities/Comment";
import { CommentResponseDto } from "../dtos/comment/CommentResponseDto";
import { CreateCommentDto } from "../dtos/comment/CreateCommentDto";
import { UpdateCommentDto } from "../dtos/comment/UpdateCommentDto";
import { TYPES } from "../../core/container/types";
import { NotFoundError, ValidationError } from "../../core/errors";

@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(TYPES.ICommentRepository) private commentRepository: ICommentRepository,
    @inject(TYPES.IBlogPostRepository) private blogPostRepository: IBlogPostRepository
  ) {}

  async getById(id: string): Promise<CommentResponseDto | null> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Comment ID is required');
    }

    const comment = await this.commentRepository.findById(id);
    return comment ? this.mapToDto(comment) : null;
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>> {
    const result = await this.commentRepository.findAll(options);
    return {
      data: result.data.map(comment => this.mapToDto(comment)),
      pagination: result.pagination,
    };
  }

  async create(dto: CreateCommentDto, authorId: string): Promise<CommentResponseDto> {
    try {
      const commentEntity = Comment.create({
        content: dto.content,
        authorId: authorId,
        blogPostId: dto.blogPostId,
        parentId: dto.parentId,
      });

      const blogPostExists = await this.blogPostRepository.exists(dto.blogPostId);
      if (!blogPostExists) {
        throw new NotFoundError('Blog post not found', { blogPostId: dto.blogPostId });
      }

      const blogPost = await this.blogPostRepository.findById(dto.blogPostId);
      if (!blogPost?.isPublished) {
        throw new ValidationError('Cannot comment on unpublished blog posts');
      }

      if (dto.parentId) {
        const parentComment = await this.commentRepository.findById(dto.parentId);
        if (!parentComment) {
          throw new NotFoundError('Parent comment not found', { parentId: dto.parentId });
        }

        if (parentComment.blogPostId !== dto.blogPostId) {
          throw new ValidationError('Parent comment does not belong to the specified blog post');
        }

        const parentEntity = Comment.fromDatabase(parentComment);
        if (!parentEntity.isApproved()) {
          throw new ValidationError('Cannot reply to non-approved comments');
        }

        if (parentEntity.isReply()) {
          throw new ValidationError('Cannot create nested replies beyond one level');
        }
      }

      const created = await this.commentRepository.create(commentEntity.toPlainObject());
      return this.mapToDto(created);

    } catch (error: any) {
      if (error.message.includes('Comment content') || error.message.includes('required')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCommentDto): Promise<CommentResponseDto> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Comment ID is required');
    }

    const existingComment = await this.commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found', { commentId: id });
    }

    const commentEntity = Comment.fromDatabase(existingComment);
    
    if (!commentEntity.canBeEdited()) {
      throw new ValidationError('Comment cannot be edited in current state');
    }

    try {
      let updatedEntity = commentEntity;
      
      if (dto.content !== undefined) {
        updatedEntity = commentEntity.updateContent(dto.content);
      }

      const updated = await this.commentRepository.update(id, updatedEntity.toPlainObject());
      return this.mapToDto(updated);

    } catch (error: any) {
      if (error.message.includes('Comment content') || error.message.includes('cannot be edited')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Comment ID is required');
    }

    const existingComment = await this.commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found', { commentId: id });
    }

    const commentEntity = Comment.fromDatabase(existingComment);
    
    if (!commentEntity.canBeDeleted()) {
      throw new ValidationError('Comment cannot be deleted in current state');
    }

    const repliesResult = await this.commentRepository.findAll({
      filters: { 
        parentId: id, 
        status: CommentStatus.APPROVED,
        isActive: true 
      }
    });

    if (repliesResult.data.length > 0) {
      const deactivated = commentEntity.deactivate();
      await this.commentRepository.update(id, {
        ...deactivated.toPlainObject(),
        content: '[Comment deleted by user]'
      });
      return true;
    }

    return await this.commentRepository.delete(id);
  }

  async getByBlogPost(blogPostId: string, options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>> {
    if (!blogPostId || blogPostId.trim() === '') {
      throw new ValidationError('Blog post ID is required');
    }

    const blogPostExists = await this.blogPostRepository.exists(blogPostId);
    if (!blogPostExists) {
      throw new NotFoundError('Blog post not found', { blogPostId });
    }

    const result = await this.commentRepository.findByBlogPost(blogPostId, options);
    return {
      data: result.data.map(comment => this.mapToDto(comment)),
      pagination: result.pagination,
    };
  }

  async getByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>> {
    if (!authorId || authorId.trim() === '') {
      throw new ValidationError('Author ID is required');
    }

    const result = await this.commentRepository.findByAuthor(authorId, options);
    return {
      data: result.data.map(comment => this.mapToDto(comment)),
      pagination: result.pagination,
    };
  }

  async getPending(options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>> {
    const result = await this.commentRepository.findPending(options);
    return {
      data: result.data.map(comment => this.mapToDto(comment)),
      pagination: result.pagination,
    };
  }

  async approve(id: string): Promise<CommentResponseDto> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Comment ID is required');
    }

    const existingComment = await this.commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found', { commentId: id });
    }

    const commentEntity = Comment.fromDatabase(existingComment);
    
    try {
      const approved = commentEntity.approve();
      const updated = await this.commentRepository.update(id, approved.toPlainObject());
      return this.mapToDto(updated);
    } catch (error: any) {
      if (error.message.includes('already approved')) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  async reject(id: string): Promise<CommentResponseDto> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Comment ID is required');
    }

    const existingComment = await this.commentRepository.findById(id);
    if (!existingComment) {
      throw new NotFoundError('Comment not found', { commentId: id });
    }

    const commentEntity = Comment.fromDatabase(existingComment);
    
    try {
      const rejected = commentEntity.reject();
      const updated = await this.commentRepository.update(id, rejected.toPlainObject());
      return this.mapToDto(updated);
    } catch (error: any) {
      if (error.message.includes('already rejected')) {
        throw new ValidationError(error.message, { commentId: id });
      }
      throw error;
    }
  }

  async approveMultiple(ids: string[]): Promise<CommentResponseDto[]> {
    if (!ids || ids.length === 0) {
      throw new ValidationError('Comment IDs array cannot be empty');
    }

    if (ids.length > 50) {
      throw new ValidationError('Cannot approve more than 50 comments at once');
    }

    const results: CommentResponseDto[] = [];
    
    for (const id of ids) {
      try {
        const approved = await this.approve(id);
        results.push(approved);
      } catch (error: any) {
        if (error.message.includes('already approved')) {
          const existing = await this.getById(id);
          if (existing) results.push(existing);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  async rejectMultiple(ids: string[]): Promise<CommentResponseDto[]> {
    if (!ids || ids.length === 0) {
      throw new ValidationError('Comment IDs array cannot be empty');
    }

    if (ids.length > 50) {
      throw new ValidationError('Cannot reject more than 50 comments at once');
    }

    const results: CommentResponseDto[] = [];
    
    for (const id of ids) {
      try {
        const rejected = await this.reject(id);
        results.push(rejected);
      } catch (error: any) {
        if (error.message.includes('already rejected')) {
          const existing = await this.getById(id);
          if (existing) results.push(existing);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  async getCommentStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalReplies: number;
    averageCommentsPerPost: number;
  }> {
    const baseStats = await this.commentRepository.getCommentStats();
    
    const totalPosts = await this.blogPostRepository.findAll({
      filters: { isPublished: true }
    }).then(result => result.pagination.total);

    const averageCommentsPerPost = totalPosts > 0 
      ? Math.round((baseStats.approved / totalPosts) * 100) / 100
      : 0;

    return {
      total: baseStats.total,
      pending: baseStats.pending,
      approved: baseStats.approved,
      rejected: baseStats.rejected,
      totalReplies: baseStats.totalReplies,
      averageCommentsPerPost,
    };
  }

  async getRecentComments(limit: number = 10): Promise<CommentResponseDto[]> {
    if (limit <= 0 || limit > 50) {
      throw new ValidationError('Limit must be between 1 and 50');
    }

    const comments = await this.commentRepository.getRecentComments(limit);
    return comments.map(comment => this.mapToDto(comment));
  }

  async getCommentsByDateRange(startDate: Date, endDate: Date): Promise<CommentResponseDto[]> {
    if (!startDate || !endDate) {
      throw new ValidationError('Start date and end date are required');
    }

    if (startDate >= endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      throw new ValidationError('Date range cannot exceed one year');
    }

    const comments = await this.commentRepository.getCommentsByDateRange(startDate, endDate);
    return comments.map(comment => this.mapToDto(comment));
  }

  async countCommentsByBlogPost(blogPostId: string): Promise<number> {
    if (!blogPostId || blogPostId.trim() === '') {
      throw new ValidationError('Blog post ID is required');
    }

    const blogPostExists = await this.blogPostRepository.exists(blogPostId);
    if (!blogPostExists) {
      throw new NotFoundError('Blog post not found', { blogPostId });
    }

    return await this.commentRepository.countCommentsByBlogPost(blogPostId);
  }

  async getTopCommentedPosts(limit: number = 10): Promise<Array<{
    blogPostId: string;
    commentCount: number;
    blogPost: {
      id: string;
      title: string;
      slug: string;
      publishedAt?: Date;
    } | null;
  }>> {
    if (limit <= 0 || limit > 50) {
      throw new ValidationError('Limit must be between 1 and 50');
    }

    const topCommented = await this.commentRepository.getTopCommentedPosts(limit);
    
    const enrichedResults = await Promise.all(
      topCommented.map(async (item) => {
        const blogPost = await this.blogPostRepository.findById(item.blogPostId);
        return {
          blogPostId: item.blogPostId,
          commentCount: item._count.id,
          blogPost: blogPost ? {
            id: blogPost.id,
            title: blogPost.title,
            slug: blogPost.slug,
            publishedAt: blogPost.publishedAt,
          } : null,
        };
      })
    );

    return enrichedResults.filter(item => item.blogPost !== null);
  }

  async createWithSpamDetection(dto: CreateCommentDto, authorId: string): Promise<CommentResponseDto> {
    const sanitizedContent = this.sanitizeContent(dto.content);
    
    if (this.isSpamContent(sanitizedContent)) {
      throw new ValidationError('Comment appears to be spam and was rejected');
    }

    return this.create({ ...dto, content: sanitizedContent }, authorId);
  }

  private mapToDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      status: comment.status,
      isActive: comment.isActive,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author?.id || '',
        username: comment.author?.username || '',
        firstName: comment.author?.firstName || '',
        lastName: comment.author?.lastName || '',
        avatar: comment.author?.avatar,
      },
      blogPost: {
        id: comment.blogPost?.id || '',
        title: comment.blogPost?.title || '',
        slug: comment.blogPost?.slug || '',
      },
      parent: comment.parent ? {
        id: comment.parent.id,
        content: comment.parent.content,
        author: {
          id: comment.parent.author?.id || '',
          username: comment.parent.author?.username || '',
          firstName: comment.parent.author?.firstName || '',
          lastName: comment.parent.author?.lastName || '',
          avatar: comment.parent.author?.avatar,
        },
      } : undefined,
      replies: comment.replies?.map((reply: any) => this.mapToDto(reply)) || undefined,
      repliesCount: comment._count?.replies || 0,
    };
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["\'][^"\']*["\']?/gi, '')
      .trim();
  }

  private isSpamContent(content: string): boolean {
    const spamPatterns = [
      /(.)\1{10,}/i,
      /(https?:\/\/[^\s]+.*){3,}/i,
      /\b(buy now|click here|free money|get rich|viagra|casino)\b/i,
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }
}