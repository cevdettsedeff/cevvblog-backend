import { CommentResponseDto } from "../../../application/dtos/comment/CommentResponseDto";
import { CreateCommentDto } from "../../../application/dtos/comment/CreateCommentDto";
import { UpdateCommentDto } from "../../../application/dtos/comment/UpdateCommentDto";
import { IFindAllOptions } from "../Common/IFindAllOptions";
import { IPaginatedResult } from "../Common/IPaginatedResult";

export interface ICommentService {
  getById(id: string): Promise<CommentResponseDto | null>;
  getAll(options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>>;
  create(dto: CreateCommentDto, authorId: string): Promise<CommentResponseDto>;
  update(id: string, dto: UpdateCommentDto): Promise<CommentResponseDto>;
  delete(id: string): Promise<boolean>;

  getByBlogPost(blogPostId: string, options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>>;
  getByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>>;
  getPending(options?: IFindAllOptions): Promise<IPaginatedResult<CommentResponseDto>>;

  approve(id: string): Promise<CommentResponseDto>;
  reject(id: string): Promise<CommentResponseDto>;
  approveMultiple(ids: string[]): Promise<CommentResponseDto[]>;
  rejectMultiple(ids: string[]): Promise<CommentResponseDto[]>;

  getCommentStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalReplies: number;
    averageCommentsPerPost: number;
  }>;

  getRecentComments(limit?: number): Promise<CommentResponseDto[]>;
  getCommentsByDateRange(startDate: Date, endDate: Date): Promise<CommentResponseDto[]>;
  countCommentsByBlogPost(blogPostId: string): Promise<number>;
  getTopCommentedPosts(limit?: number): Promise<Array<{
    blogPostId: string;
    commentCount: number;
    blogPost: {
      id: string;
      title: string;
      slug: string;
      publishedAt?: Date;
    } | null;
  }>>;

  createWithSpamDetection(dto: CreateCommentDto, authorId: string): Promise<CommentResponseDto>;
}