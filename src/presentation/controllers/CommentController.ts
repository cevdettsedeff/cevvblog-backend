import { FastifyReply, FastifyRequest } from "fastify";
import { inject, injectable } from "inversify";
import { TYPES } from "../../core/container/types";
import { ICommentService } from "../../core/interfaces/Services/ICommentService";
import { CreateCommentDto } from "../../application/dtos/comment/CreateCommentDto";
import { UpdateCommentDto } from "../../application/dtos/comment/UpdateCommentDto";
import logger from "../../utils/logger";

@injectable()
export class CommentController {
  constructor(
    @inject(TYPES.ICommentService) private commentService: ICommentService
  ) {}

  // GET /api/comments/:id
  async getCommentById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment ID is required',
          statusCode: 400
        });
      }

      const comment = await this.commentService.getById(id);
      
      if (!comment) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Comment not found',
          statusCode: 404
        });
      }
      
      return reply.send({
        success: true,
        data: comment,
      });
    } catch (error: any) {
      logger.error('Get comment error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch comment',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/post/:blogPostId
  async getCommentsByPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { blogPostId } = request.params as { blogPostId: string };
      const query = request.query as any;
      
      if (!blogPostId || blogPostId.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Blog post ID is required',
          statusCode: 400
        });
      }
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.commentService.getByBlogPost(blogPostId, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get comments by post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        query: request.query,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch comments',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/author/:authorId
  async getCommentsByAuthor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { authorId } = request.params as { authorId: string };
      const query = request.query as any;
      
      if (!authorId || authorId.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Author ID is required',
          statusCode: 400
        });
      }
      
      if (authorId !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          success: false,
          error: 'Forbidden',
          message: 'Not authorized to view these comments',
          statusCode: 403
        });
      }
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.commentService.getByAuthor(authorId, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get comments by author error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        query: request.query,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch comments by author',
        statusCode: 500
      });
    }
  }

  // POST /api/comments
  async createComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const commentData = request.body as CreateCommentDto;
      
      if (!commentData.content || commentData.content.trim().length < 10) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment content must be at least 10 characters long',
          statusCode: 400
        });
      }

      if (commentData.content.length > 1000) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment content cannot exceed 1000 characters',
          statusCode: 400
        });
      }

      if (!commentData.blogPostId || commentData.blogPostId.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Blog post ID is required',
          statusCode: 400
        });
      }
      
      const comment = await this.commentService.create(commentData, request.user!.id);
      
      logger.info('Comment created', {
        commentId: comment.id,
        blogPostId: commentData.blogPostId,
        authorId: request.user!.id,
        hasParent: !!commentData.parentId,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Comment created successfully and is pending approval',
        data: comment,
      });
    } catch (error: any) {
      logger.error('Create comment error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create comment',
        statusCode: 500
      });
    }
  }

  // POST /api/comments/with-spam-detection
  async createCommentWithSpamDetection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const commentData = request.body as CreateCommentDto;
      
      const comment = await this.commentService.createWithSpamDetection(commentData, request.user!.id);
      
      logger.info('Comment created with spam detection', {
        commentId: comment.id,
        blogPostId: commentData.blogPostId,
        authorId: request.user!.id,
        hasParent: !!commentData.parentId,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Comment created successfully with spam detection and is pending approval',
        data: comment,
      });
    } catch (error: any) {
      logger.error('Create comment with spam detection error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create comment',
        statusCode: 500
      });
    }
  }

  // PUT /api/comments/:id
  async updateComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateCommentDto;
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment ID is required',
          statusCode: 400
        });
      }

      if (updateData.content && updateData.content.trim().length < 10) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment content must be at least 10 characters long',
          statusCode: 400
        });
      }

      if (updateData.content && updateData.content.length > 1000) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment content cannot exceed 1000 characters',
          statusCode: 400
        });
      }
      
      const existingComment = await this.commentService.getById(id);
      if (!existingComment) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Comment not found',
          statusCode: 404
        });
      }

      if (existingComment.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          success: false,
          error: 'Forbidden',
          message: 'Not authorized to update this comment',
          statusCode: 403
        });
      }

      if (request.user!.role !== 'ADMIN' && existingComment.status !== 'PENDING') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Can only edit pending comments',
          statusCode: 400
        });
      }
      
      const comment = await this.commentService.update(id, updateData);
      
      logger.info('Comment updated', {
        commentId: id,
        updatedBy: request.user!.id,
        updatedFields: Object.keys(updateData),
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      });
    } catch (error: any) {
      logger.error('Update comment error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update comment',
        statusCode: 500
      });
    }
  }

  // DELETE /api/comments/:id
  async deleteComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment ID is required',
          statusCode: 400
        });
      }
      
      const existingComment = await this.commentService.getById(id);
      if (!existingComment) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Comment not found',
          statusCode: 404
        });
      }

      if (existingComment.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          success: false,
          error: 'Forbidden',
          message: 'Not authorized to delete this comment',
          statusCode: 403
        });
      }
      
      const success = await this.commentService.delete(id);
      if (!success) {
        return reply.status(500).send({ 
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete comment',
          statusCode: 500
        });
      }

      logger.info('Comment deleted', {
        commentId: id,
        deletedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete comment error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete comment',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/recent
  async getRecentComments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = parseInt(query.limit) || 10;
      
      const comments = await this.commentService.getRecentComments(limit);
      
      return reply.send({
        success: true,
        data: comments,
        meta: {
          limit,
          count: comments.length
        }
      });
    } catch (error: any) {
      logger.error('Get recent comments error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch recent comments',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/date-range
  async getCommentsByDateRange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      
      if (!query.startDate || !query.endDate) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Start date and end date are required',
          statusCode: 400
        });
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Invalid date format',
          statusCode: 400
        });
      }
      
      const comments = await this.commentService.getCommentsByDateRange(startDate, endDate);
      
      return reply.send({
        success: true,
        data: comments,
        meta: {
          startDate,
          endDate,
          count: comments.length
        }
      });
    } catch (error: any) {
      logger.error('Get comments by date range error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch comments by date range',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/top-posts
  async getTopCommentedPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = parseInt(query.limit) || 10;
      
      const topPosts = await this.commentService.getTopCommentedPosts(limit);
      
      return reply.send({
        success: true,
        data: topPosts,
        meta: {
          limit,
          count: topPosts.length
        }
      });
    } catch (error: any) {
      logger.error('Get top commented posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch top commented posts',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/count/:blogPostId
  async countCommentsByBlogPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { blogPostId } = request.params as { blogPostId: string };
      
      if (!blogPostId || blogPostId.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Blog post ID is required',
          statusCode: 400
        });
      }
      
      const count = await this.commentService.countCommentsByBlogPost(blogPostId);
      
      return reply.send({
        success: true,
        data: {
          blogPostId,
          count
        }
      });
    } catch (error: any) {
      logger.error('Count comments by blog post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to count comments',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/pending
  async getPendingComments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.commentService.getPending(options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get pending comments error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch pending comments',
        statusCode: 500
      });
    }
  }

  // PUT /api/comments/:id/approve
  async approveComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment ID is required',
          statusCode: 400
        });
      }
      
      const comment = await this.commentService.approve(id);
      
      logger.info('Comment approved', {
        commentId: id,
        approvedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Comment approved successfully',
        data: comment,
      });
    } catch (error: any) {
      logger.error('Approve comment error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to approve comment',
        statusCode: 500
      });
    }
  }

  // PUT /api/comments/:id/reject
  async rejectComment(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment ID is required',
          statusCode: 400
        });
      }
      
      const comment = await this.commentService.reject(id);
      
      logger.info('Comment rejected', {
        commentId: id,
        rejectedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Comment rejected successfully',
        data: comment,
      });
    } catch (error: any) {
      logger.error('Reject comment error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to reject comment',
        statusCode: 500
      });
    }
  }

  // POST /api/comments/bulk-approve
  async bulkApproveComments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { commentIds } = request.body as { commentIds: string[] };
      
      if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment IDs array is required and cannot be empty',
          statusCode: 400
        });
      }

      if (commentIds.length > 50) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Cannot approve more than 50 comments at once',
          statusCode: 400
        });
      }
      
      const comments = await this.commentService.approveMultiple(commentIds);
      
      logger.info('Bulk comments approved', {
        commentIds,
        count: comments.length,
        approvedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: `${comments.length} comments approved successfully`,
        data: comments,
      });
    } catch (error: any) {
      logger.error('Bulk approve comments error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError' || error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: error.name,
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to bulk approve comments',
        statusCode: 500
      });
    }
  }

  // POST /api/comments/bulk-reject
  async bulkRejectComments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { commentIds } = request.body as { commentIds: string[] };
      
      if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Comment IDs array is required and cannot be empty',
          statusCode: 400
        });
      }

      if (commentIds.length > 50) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Cannot reject more than 50 comments at once',
          statusCode: 400
        });
      }
      
      const comments = await this.commentService.rejectMultiple(commentIds);
      
      logger.info('Bulk comments rejected', {
        commentIds,
        count: comments.length,
        rejectedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: `${comments.length} comments rejected successfully`,
        data: comments,
      });
    } catch (error: any) {
      logger.error('Bulk reject comments error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError' || error.name === 'ValidationError') {
        return reply.status(400).send({ 
          success: false,
          error: error.name,
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to bulk reject comments',
        statusCode: 500
      });
    }
  }

  // GET /api/comments/stats
  async getCommentStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.commentService.getCommentStats();
      
      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get comment stats error:', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch comment statistics',
        statusCode: 500
      });
    }
  }
}