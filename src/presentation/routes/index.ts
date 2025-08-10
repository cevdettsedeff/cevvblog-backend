import { FastifyInstance } from 'fastify';
import { config } from '../../config/env';
import logger from '../../utils/logger';
import { registerUserRoutes } from './userRoutes';
import { registerCategoryRoutes } from './categoryRoutes';
import { registerBlogPostRoutes } from './blogPostRoutes';
import { registerCommentRoutes } from './commentRoutes';

export async function registerAllRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async (request, reply) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      },
      environment: config.nodeEnv,
    };

    logger.info('Health check accessed', {
      requestId: (request as any).id,
      healthData
    });

    return healthData;
  });

  // API info
  fastify.get('/api', async (request, reply) => {
    const apiInfo = {
      name: 'Blog API',
      version: '1.0.0',
      description: 'Modern blog backend API with Clean Architecture',
      endpoints: {
        users: '/api/users',
        categories: '/api/categories',
        posts: '/api/posts',
        comments: '/api/comments',
      },
      documentation: '/api/docs',
    };

    logger.info('API info accessed', {
      requestId: (request as any).id
    });

    return apiInfo;
  });

  // Register API routes
  await fastify.register(registerUserRoutes, { prefix: '/api/users' });
  await fastify.register(registerCategoryRoutes, { prefix: '/api/categories' });
  await fastify.register(registerBlogPostRoutes, { prefix: '/api/posts' });
  await fastify.register(registerCommentRoutes, { prefix: '/api/comments' });

  // Search endpoint
  fastify.get('/api/search', async (request, reply) => {
    const { q, type = 'posts', ...options } = request.query as any;
    
    if (!q) {
      return reply.status(400).send({ error: 'Search query is required' });
    }

    logger.info('Search accessed', {
      requestId: (request as any).id,
      query: q,
      type
    });

    return {
      query: q,
      type,
      results: [],
      total: 0,
    };
  });

  // 404 handler
  fastify.setNotFoundHandler(async (request, reply) => {
    const notFoundResponse = {
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    };

    logger.warn('Route not found', {
      requestId: (request as any).id,
      method: request.method,
      url: request.url,
      ip: request.ip
    });

    return reply.status(404).send(notFoundResponse);
  });
}