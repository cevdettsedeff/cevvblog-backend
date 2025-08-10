import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../../core/middleware/auth';
import { validateBody } from '../../core/middleware/validation';
import { commentSchemas } from '../../application/validators/schemas';
import { CommentRoutesSchema } from '../../schemas/routes/commentRoutesSchema';
import { TYPES } from '../../core/container/types';
import { DIContainer } from '../../core/container/DIContainer';
import { CommentController } from '../controllers/CommentController';

export async function registerCommentRoutes(fastify: FastifyInstance) {
  const commentController = DIContainer.get(TYPES.CommentController) as CommentController;

  // Public routes
  fastify.get('/post/:blogPostId', {
    schema: CommentRoutesSchema.GetCommentsByPost.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getCommentsByPost(request, reply);
    }
  });

  fastify.get('/:id', {
    schema: CommentRoutesSchema.GetCommentById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getCommentById(request, reply);
    }
  });

  // User routes (require authentication)
  fastify.post('/', {
    schema: CommentRoutesSchema.CreateComment.schema,
    preHandler: [
      fastify.authenticate,
      validateBody(commentSchemas.create)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.createComment(request, reply);
    }
  });

  fastify.post('/with-spam-detection', {
    schema: CommentRoutesSchema.CreateCommentWithSpamDetection.schema,
    preHandler: [
      fastify.authenticate,
      validateBody(commentSchemas.create)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.createCommentWithSpamDetection(request, reply);
    }
  });

  fastify.put('/:id', {
    schema: CommentRoutesSchema.UpdateComment.schema,
    preHandler: [
      fastify.authenticate,
      validateBody(commentSchemas.update)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.updateComment(request, reply);
    }
  });

  fastify.delete('/:id', {
    schema: CommentRoutesSchema.DeleteComment.schema,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.deleteComment(request, reply);
    }
  });

  // Analytics routes (some public, some admin)
  fastify.get('/recent', {
    schema: CommentRoutesSchema.GetRecentComments.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getRecentComments(request, reply);
    }
  });

  fastify.get('/date-range', {
    schema: CommentRoutesSchema.GetCommentsByDateRange.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getCommentsByDateRange(request, reply);
    }
  });

  fastify.get('/top-posts', {
    schema: CommentRoutesSchema.GetTopCommentedPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getTopCommentedPosts(request, reply);
    }
  });

  fastify.get('/count/:blogPostId', {
    schema: CommentRoutesSchema.CountCommentsByBlogPost.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.countCommentsByBlogPost(request, reply);
    }
  });

  // Comments by author
  fastify.get('/author/:authorId', {
    schema: CommentRoutesSchema.GetCommentsByAuthor.schema,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getCommentsByAuthor(request, reply);
    }
  });

  // Admin routes
  fastify.get('/pending', {
    schema: CommentRoutesSchema.GetPendingComments.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getPendingComments(request, reply);
    }
  });

  fastify.put('/:id/approve', {
    schema: CommentRoutesSchema.ApproveComment.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.approveComment(request, reply);
    }
  });

  fastify.put('/:id/reject', {
    schema: CommentRoutesSchema.RejectComment.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.rejectComment(request, reply);
    }
  });

  // Bulk operations (Admin only)
  fastify.post('/bulk-approve', {
    schema: CommentRoutesSchema.BulkApproveComments.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.bulkApproveComments(request, reply);
    }
  });

  fastify.post('/bulk-reject', {
    schema: CommentRoutesSchema.BulkRejectComments.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.bulkRejectComments(request, reply);
    }
  });

  // Stats (Admin only)
  fastify.get('/stats', {
    schema: CommentRoutesSchema.GetCommentStats.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return commentController.getCommentStats(request, reply);
    }
  });
}