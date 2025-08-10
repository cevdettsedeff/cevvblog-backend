import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../utils/logger";
import { TYPES } from "../../core/container/types";
import { LoginDto } from "../../application/dtos/auth/LoginDto";
import { IUserService } from "../../core/interfaces/Services/IUserService";
import { IAuthService } from "../../core/interfaces/Services/IAuthService";
import { RegisterDto } from "../../application/dtos/auth/RegisterDto";
import { inject, injectable } from "inversify";
import { 
  BaseError, 
  NotFoundError,
  ValidationError,
  UnauthorizedError
} from "../../core/errors";

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.IUserService) private userService: IUserService,
    @inject(TYPES.IAuthService) private authService: IAuthService
  ) {}

  // POST /api/users/register
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registerData = request.body as RegisterDto;
      
      const result = await this.authService.register(registerData);
      
      // Generate JWT token
      result.token = request.server.jwt.sign(
        { id: result.user.id },
        { expiresIn: '7d' }
      );
      
      logger.info('User registered successfully', {
        userId: result.user.id,
        username: result.user.username,
        email: result.user.email,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Register error');
    }
  }

  // POST /api/users/login
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const loginData = request.body as LoginDto;
      const result = await this.authService.login(loginData);
      
      if (!result) {
        logger.warn('Failed login attempt', {
          email: loginData.email,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        });
        
        return reply.status(401).send({ 
          error: 'Authentication Error',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401
        });
      }

      // Generate JWT token
      result.token = request.server.jwt.sign(
        { id: result.user.id },
        { expiresIn: '7d' }
      );

      logger.info('User logged in successfully', {
        userId: result.user.id,
        username: result.user.username,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Login error');
    }
  }

  // GET /api/users/profile (Auth required)
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.userService.getById(request.user!.id);
      
      if (!user) {
        throw new NotFoundError('User not found', { userId: request.user!.id });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get profile error');
    }
  }

  // PUT /api/users/profile (Auth required)
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const updateData = request.body as any;
      
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const sanitizedData = this.sanitizeUpdateData(updateData);

      const user = await this.userService.update(request.user!.id, sanitizedData);
      
      logger.info('User profile updated', {
        userId: request.user!.id,
        updatedFields: Object.keys(sanitizedData),
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Update profile error');
    }
  }

  // GET /api/users/authors
  async getAuthors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authors = await this.userService.getAuthors();
      
      return reply.send({
        success: true,
        data: authors,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get authors error');
    }
  }

  // GET /api/users/:id
  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const user = await this.userService.getById(id);
      
      if (!user) {
        throw new NotFoundError('User not found', { userId: id });
      }

      // Don't expose sensitive information for public user profiles
      const publicUser = this.mapToPublicUser(user);

      return reply.send({
        success: true,
        data: publicUser,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get user error');
    }
  }

  // GET /api/users (Auth required - ADMIN only)
  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const options = this.parseQueryOptions(query);

      const result = await this.userService.getAll(options);
      
      logger.info('Admin fetched all users', {
        adminId: request.user!.id,
        page: options.page,
        limit: options.limit,
        totalUsers: result.pagination.total,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get all users error');
    }
  }

  // GET /api/users/:id/stats (Auth required - ADMIN or own stats)
  async getUserStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      // Check if user can access these stats
      if (request.user!.id !== id && request.user!.role !== 'ADMIN') {
        throw new UnauthorizedError('Not authorized to view these stats', {
          requestedUserId: id,
          currentUserId: request.user!.id
        });
      }

      const user = await this.userService.getById(id);
      if (!user) {
        throw new NotFoundError('User not found', { userId: id });
      }

      const stats = {
        postsCount: user.postsCount,
        commentsCount: user.commentsCount,
        joinedAt: user.createdAt,
        lastUpdated: user.updatedAt,
        isActive: user.isActive,
        role: user.role,
      };

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get user stats error');
    }
  }

  // Private helper methods
  private sanitizeUpdateData(updateData: any): any {
    const sanitized = { ...updateData };
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete sanitized.email;
    delete sanitized.password;
    delete sanitized.role;
    delete sanitized.isActive;
    delete sanitized.id;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    
    return sanitized;
  }

  private mapToPublicUser(user: any): any {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      postsCount: user.postsCount,
      commentsCount: user.commentsCount,
    };
  }

  private parseQueryOptions(query: any): any {
    try {
      return {
        page: Math.max(1, parseInt(query.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(query.limit) || 20)),
        sortBy: query.sortBy || 'createdAt',
        sortOrder: ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : 'desc',
        filters: query.filters ? JSON.parse(query.filters) : {},
      };
    } catch (error) {
      throw new ValidationError('Invalid query parameters', { query });
    }
  }

  private handleError(
    error: any, 
    request: FastifyRequest, 
    reply: FastifyReply, 
    context: string
  ) {
    if (error instanceof BaseError) {
      logger.warn('Operational error occurred', {
        error: error.toJSON(),
        context,
        request: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userId: request.user?.id,
        },
      });

      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
    }

    // Unexpected errors
    logger.error('Unexpected error occurred', {
      error: error.message,
      stack: error.stack,
      context,
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userId: request.user?.id,
        body: request.body,
        params: request.params,
        query: request.query,
      },
    });

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Something went wrong',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
    });
  }
}