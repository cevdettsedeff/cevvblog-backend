import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config/env';
import { DIContainer } from './core/container/DIContainer';
import { DatabaseConfig } from './config/database';
import logger from './utils/logger';

// Plugins
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Middleware
import { authMiddleware } from './core/middleware/auth';
import { errorHandler } from './core/middleware/errorHandler';

export class Application {
  private app: FastifyInstance;
  private container = DIContainer.getContainer();
  private database = DatabaseConfig.getInstance();

  constructor() {
    this.app = Fastify({
      logger: false, // Fastify'ın built-in logger'ını devre dışı bırak
      bodyLimit: 10485760, // 10MB
      keepAliveTimeout: 30000,
      connectionTimeout: 10000,
    });
  }

  public async initialize(): Promise<void> {
    try {
      await this.setupDatabase();
      await this.setupPlugins();
      await this.setupMiddleware();
      await this.setupRoutes();
      await this.setupErrorHandling();
      
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  private async setupDatabase(): Promise<void> {
    try {
      await this.database.connect();
      logger.database('Database connection established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  private async setupPlugins(): Promise<void> {
    // Swagger Documentation
    await this.app.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Blog API',
          description: 'Modern blog backend API with Clean Architecture',
          version: '1.0.0',
          contact: {
            name: 'API Support',
            email: 'support@yourdomain.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT Authorization header using the Bearer scheme.'
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ],
        tags: [
          { name: 'Authentication', description: 'Authentication endpoints' },
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Categories', description: 'Category management endpoints' },
          { name: 'Blog Posts', description: 'Blog post endpoints' },
          { name: 'Comments', description: 'Comment management endpoints' },
          { name: 'Health', description: 'System health endpoints' }
        ]
      }
    });

    // Swagger UI
    await this.app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1
      },
      uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      transformSpecificationClone: true
    });

    // Security
    await this.app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    });

    // CORS
    await this.app.register(cors, {
      origin: (origin, callback) => {
        // Eğer origin yok ise (Postman, server-to-server vb.)
        if (!origin) {
          callback(null, true);
          return;
        }

        try {
          const hostname = new URL(origin).hostname;
          
          // Localhost ve geliştirme ortamı için izin ver
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            callback(null, true);
            return;
          }
          
          // Konfigürasyondaki origin ile eşleşen isteklere izin ver
          if (config.cors.origin === origin) {
            callback(null, true);
            return;
          }
          
          // Diğer tüm origin'ler için reddet
          logger.security('CORS blocked request', { 
            origin, 
            expectedOrigin: config.cors.origin 
          });
          callback(new Error("Not allowed by CORS"), false);
        } catch (error) {
          // URL parse hatası durumunda reddet
          logger.security('CORS blocked request - invalid origin format', { 
            origin,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          callback(new Error("Invalid origin format"), false);
        }
      },
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // JWT
    await this.app.register(jwt, {
      secret: config.jwt.secret,
      sign: {
        expiresIn: config.jwt.expiresIn,
      },
    });

    // File uploads
    await this.app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5,
        fields: 10,
      },
      attachFieldsToBody: false,
    });

    logger.info('Plugins registered successfully');
  }

  private async setupMiddleware(): Promise<void> {
    // Request ID
    this.app.addHook('onRequest', async (request, reply) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      (request as any).id = requestId;
      reply.header('x-request-id', requestId);
    });

    // Add DI container to request context
    this.app.addHook('onRequest', async (request) => {
      (request as any).container = this.container;
    });

    // Request logging with Winston
    this.app.addHook('onRequest', async (request) => {
      const startTime = Date.now();
      (request as any).startTime = startTime;
      
      logger.request(`Incoming ${request.method} ${request.url}`, {
        requestId: (request as any).id,
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        contentType: request.headers['content-type'],
        contentLength: request.headers['content-length'],
        timestamp: new Date().toISOString()
      });
    });

    // Response logging with Winston
    this.app.addHook('onResponse', async (request, reply) => {
      const endTime = Date.now();
      const startTime = (request as any).startTime || endTime;
      const duration = endTime - startTime;

      const logLevel = reply.statusCode >= 400 ? 'warn' : 'info';
      const logMethod = reply.statusCode >= 500 ? 'error' : 
                       reply.statusCode >= 400 ? 'warn' : 'info';

      logger[logMethod](`Response ${request.method} ${request.url} - ${reply.statusCode}`, {
        requestId: (request as any).id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${duration}ms`,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      // Performance monitoring
      if (duration > 1000) { // 1 saniyeden uzun süren istekleri logla
        logger.performance(`Slow request detected`, {
          requestId: (request as any).id,
          method: request.method,
          url: request.url,
          duration: `${duration}ms`,
          statusCode: reply.statusCode
        });
      }
    });

    // Error logging hook
    this.app.addHook('onError', async (request, reply, error) => {
      logger.error('Request error occurred', {
        requestId: (request as any).id,
        method: request.method,
        url: request.url,
        error: error.message,
        stack: error.stack,
        statusCode: reply.statusCode || 500
      });
    });

    // Auth middleware decorator
    this.app.decorate('authenticate', authMiddleware);

    logger.info('Middleware setup completed');
  }

  private async setupRoutes(): Promise<void> {
    // Import and register all routes through the centralized function
    const { registerAllRoutes } = await import('./presentation/routes/index');
    await this.app.register(registerAllRoutes);

    logger.info('Routes registered successfully');
  }

  private async setupErrorHandling(): Promise<void> {
    this.app.setErrorHandler(errorHandler);
    
    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await this.stop();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection detected', {
        reason: reason,
        promise: promise,
        stack: reason instanceof Error ? reason.stack : undefined
      });
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception detected', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    logger.info('Error handling setup completed');
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();
      
      const address = await this.app.listen({
        port: Number(config.port),
        host: '0.0.0.0',
      });
      
      logger.info(`🚀 Server running at ${address}`, {
        port: config.port,
        environment: config.nodeEnv,
        nodeVersion: process.version,
        platform: process.platform
      });
      
      logger.info(`📚 API Documentation: ${address}/docs`);
      logger.info(`🔍 Swagger JSON: ${address}/docs/json`);
      logger.info(`🏥 Health Check: ${address}/health`);
      
    } catch (error) {
      logger.error('Error starting server:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info('Stopping server...');
      await this.app.close();
      await this.database.disconnect();
      logger.info('Server stopped successfully');
    } catch (error) {
      logger.error('Error stopping server:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  public getInstance(): FastifyInstance {
    return this.app;
  }

  public getContainer() {
    return this.container;
  }
}