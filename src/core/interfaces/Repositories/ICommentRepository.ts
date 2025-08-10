import { Comment } from "../../../domain/entities/Comment";
import { CommentStatus } from "../../../domain/enums/CommentStatus";
import { IFindAllOptions } from "../Common/IFindAllOptions";
import { IPaginatedResult } from "../Common/IPaginatedResult";
import { IRepository } from "../IRepository";

export interface ICommentRepository extends IRepository<Comment> {
  hardDelete(id: string): Promise<boolean>;

  findByBlogPost(blogPostId: string, options?: IFindAllOptions): Promise<IPaginatedResult<Comment>>;
  findByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<Comment>>;
  findPending(options?: IFindAllOptions): Promise<IPaginatedResult<Comment>>;
  findByStatus(status: CommentStatus, options?: IFindAllOptions): Promise<IPaginatedResult<Comment>>;
  searchComments(query: string, options?: IFindAllOptions): Promise<IPaginatedResult<Comment>>;

  approveComment(id: string): Promise<Comment>;
  rejectComment(id: string): Promise<Comment>;
  bulkApprove(ids: string[]): Promise<number>;
  bulkReject(ids: string[]): Promise<number>;
  bulkDelete(ids: string[]): Promise<number>;

  findCommentsNeedingReview(): Promise<Comment[]>;
  findSuspiciousComments(): Promise<Comment[]>;

  getCommentStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    inactive: number;
    totalReplies: number;
  }>;

  getRecentComments(limit?: number): Promise<Comment[]>;
  getCommentsByDateRange(startDate: Date, endDate: Date): Promise<Comment[]>;
  countCommentsByBlogPost(blogPostId: string): Promise<number>;
  getTopCommentedPosts(limit?: number): Promise<Array<{
    blogPostId: string;
    _count: { id: number };
  }>>;

  getCommentTrends(days?: number): Promise<Array<{
    date: string;
    count: number;
    status: CommentStatus;
  }>>;

  getMostActiveCommenters(limit?: number): Promise<Array<{
    authorId: string;
    _count: { id: number };
  }>>;

  getCommentEngagementStats(): Promise<{
    averageCommentsPerPost: number;
    averageRepliesPerComment: number;
    engagementRate: number;
  }>;

  cleanupOldRejectedComments(daysOld?: number): Promise<number>;
  getOrphanedComments(): Promise<Comment[]>;
}