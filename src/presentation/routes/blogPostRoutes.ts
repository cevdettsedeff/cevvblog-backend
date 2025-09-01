import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlogPostController } from '../controllers/BlogPostController';
import { 
  authenticate, 
  authorOrAdmin 
} from '../../core/middleware/auth';
import { validateBody } from '../../core/middleware/validation';
import { blogPostSchemas } from '../../application/validators/schemas';
import { BlogPostRoutesSchema } from '../../schemas/routes/blogPostRoutesSchema';
import { TYPES } from '../../core/container/types';
import { DIContainer } from '../../core/container/DIContainer';

export async function registerBlogPostRoutes(fastify: FastifyInstance) {
  const blogPostController = DIContainer.get<BlogPostController>(TYPES.BlogPostController);

  // Public routes
  fastify.get('/', {
    schema: BlogPostRoutesSchema.GetAllPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getAllPosts(request, reply);
    }
  });

  fastify.get('/popular', {
    schema: BlogPostRoutesSchema.GetPopularPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getPopularPosts(request, reply);
    }
  });

  fastify.get('/recent', {
    schema: BlogPostRoutesSchema.GetRecentPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getRecentPosts(request, reply);
    }
  });

  fastify.get('/search', {
    schema: BlogPostRoutesSchema.SearchPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.searchPosts(request, reply);
    }
  });

  fastify.get('/:id', {
    schema: BlogPostRoutesSchema.GetPostById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getPostById(request, reply);
    }
  });

  fastify.get('/slug/:slug', {
    schema: BlogPostRoutesSchema.GetPostBySlug.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getPostBySlug(request, reply);
    }
  });

  fastify.get('/category/:categorySlug', {
    schema: BlogPostRoutesSchema.GetPostsByCategory.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getPostsByCategory(request, reply);
    }
  });

  fastify.get('/author/:authorId', {
    schema: BlogPostRoutesSchema.GetPostsByAuthor.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.getPostsByAuthor(request, reply);
    }
  });

  // Author/Admin routes
  fastify.post('/', {
    schema: BlogPostRoutesSchema.CreatePost.schema,
    preHandler: [
      authenticate, 
      authorOrAdmin,
      validateBody(blogPostSchemas.create)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.createPost(request, reply);
    }
  });

  fastify.put('/:id', {
    schema: BlogPostRoutesSchema.UpdatePost.schema,
    preHandler: [
      authenticate, 
      authorOrAdmin,
      validateBody(blogPostSchemas.update)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.updatePost(request, reply);
    }
  });

  fastify.delete('/:id', {
    schema: BlogPostRoutesSchema.DeletePost.schema,
    preHandler: [
      authenticate, 
      authorOrAdmin
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.deletePost(request, reply);
    }
  });

  fastify.post('/:id/upload-image', {
    schema: BlogPostRoutesSchema.UploadImage.schema,
    preHandler: [
      authenticate, 
      authorOrAdmin
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.uploadImage(request, reply);
    }
  });

  // Multiple images upload
  fastify.post('/:id/upload-images', {
    schema: BlogPostRoutesSchema.UploadMultipleImages.schema,
    preHandler: [
      authenticate, 
      authorOrAdmin
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return blogPostController.uploadMultipleImages(request, reply);
    }
  });
}