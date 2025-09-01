// src/presentation/controllers/UserController.ts
import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../utils/logger";
import { TYPES } from "../../core/container/types";
import { LoginDto } from "../../application/dtos/auth/LoginDto";
import { IUserService } from "../../core/interfaces/Services/IUserService";
import { IAuthService } from "../../core/interfaces/Services/IAuthService";
import { RegisterDto } from "../../application/dtos/auth/RegisterDto";
import { UpdateUserDto } from "../../application/dtos/user/UpdateUserDto";
import { inject, injectable } from "inversify";
import { 
  BaseError, 
  NotFoundError,
  ValidationError,
  UnauthorizedError
} from "../../core/errors";
import { UserRole } from "@prisma/client";
import { ChangePasswordRequest } from "../../core/interfaces/Requests/ChangePasswordRequest";

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
      
      // AuthService'den gelen response'u olduğu gibi kullan
      const result = await this.authService.register(registerData);
      
      logger.info('User registered successfully', {
        userId: result.user.id,
        username: result.user.username,
        email: result.user.email,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: result, // AuthService'den gelen tam response
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

      logger.info('User logged in successfully', {
        userId: result!.user.id,
        username: result!.user.username,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: 'Login successful',
        data: result, // AuthService'den gelen tam response
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Login error');
    }
  }

  // POST /api/users/logout
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers['authorization'];
      if (!authHeader) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Missing authorization header',
          code: 'NO_AUTH_HEADER',
          statusCode: 401,
        });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Refresh token'ı da al (varsa)
      const refreshToken = request.headers['x-refresh-token'] as string;
      
      await this.authService.logout(token, refreshToken);

      logger.info('User logged out successfully', {
        userId: request.user?.id,
        ip: request.ip,
      });

      return reply.send({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Logout error');
    }
  }

  // POST /api/users/refresh
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body as { refreshToken: string };
      
      if (!refreshToken) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
          statusCode: 400,
        });
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      if (!result) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
          statusCode: 401,
        });
      }

      logger.info('Token refreshed successfully', {
        ip: request.ip,
      });

      return reply.send({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Refresh token error');
    }
  }

  // GET /api/users/profile (Auth required)
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.userService.getProfile(request.user!.id);
      
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
      const updateData = request.body as UpdateUserDto;
      
      // updateProfile kullan (otomatik sanitization)
      const user = await this.userService.updateProfile(request.user!.id, updateData);
      
      logger.info('User profile updated', {
        userId: request.user!.id,
        updatedFields: Object.keys(updateData),
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

  // POST /api/users/change-password (Auth required)
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { currentPassword, newPassword, confirmPassword } = request.body as ChangePasswordRequest;
      
      // Password confirmation kontrolü
      if (newPassword !== confirmPassword) {
        throw new ValidationError('New password and confirmation do not match');
      }

      await this.authService.changePassword(request.user!.id, currentPassword, newPassword);
      
      logger.info('Password changed successfully', {
        userId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Change password error');
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
      
      // Public user bilgilerini döndür
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
      
      // Authorization kontrolü
      if (request.user!.id !== id && request.user!.role !== UserRole.ADMIN) {
        throw new UnauthorizedError('Not authorized to view these stats', {
          requestedUserId: id,
          currentUserId: request.user!.id
        });
      }

      const stats = await this.userService.getUserStats(id);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Get user stats error');
    }
  }

  // POST /api/users/:id/promote (Auth required - ADMIN only)
  async promoteToAuthor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const user = await this.userService.promoteToAuthor(id);
      
      logger.info('User promoted to author', {
        adminId: request.user!.id,
        targetUserId: id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'User promoted to author successfully',
        data: user,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Promote user error');
    }
  }

  // POST /api/users/:id/demote (Auth required - ADMIN only)
  async demoteToUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const user = await this.userService.demoteToUser(id);
      
      logger.info('User demoted to regular user', {
        adminId: request.user!.id,
        targetUserId: id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'User demoted successfully',
        data: user,
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Demote user error');
    }
  }

  // POST /api/users/:id/deactivate (Auth required - ADMIN only)
  async deactivateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      await this.userService.deactivateUser(id);
      
      logger.info('User deactivated', {
        adminId: request.user!.id,
        targetUserId: id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Deactivate user error');
    }
  }

  // POST /api/users/:id/activate (Auth required - ADMIN only)
  async activateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      await this.userService.activateUser(id);
      
      logger.info('User activated', {
        adminId: request.user!.id,
        targetUserId: id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error: any) {
      return this.handleError(error, request, reply, 'Activate user error');
    }
  }

  // Private helper methods
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
      postsCount: user.postsCount || 0,
      commentsCount: user.commentsCount || 0,
    };
  }

  private parseQueryOptions(query: any): any {
    try {
      const filters: any = {};
      
      // Role filter
      if (query.role && Object.values(UserRole).includes(query.role)) {
        filters.role = query.role;
      }
      
      // Search filter (bu implementation Prisma'ya göre değişebilir)
      if (query.search) {
        filters.OR = [
          { email: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { username: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      return {
        page: Math.max(1, parseInt(query.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(query.limit) || 20)),
        sortBy: query.sortBy || 'createdAt',
        sortOrder: ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : 'desc',
        filters,
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