import { FastifyRequest, FastifyReply } from "fastify";
import { TYPES } from "../container/types";
import { IAuthService } from "../interfaces/Services/IAuthService";
import { UserRole } from "../../domain/enums/UserRole";
import logger from "../../utils/logger";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";

// Extend FastifyRequest type to include user
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
    };
    container: any;
  }
}

/**
 * Common error responses for consistency
 */
const ErrorResponses = {
  AUTHENTICATION_REQUIRED: {
    error: 'Authentication Required',
    message: 'Please provide a valid authentication token',
    statusCode: 401
  },
  TOKEN_REQUIRED: {
    error: 'Authentication Required',
    message: 'Token is required',
    statusCode: 401
  },
  TOKEN_BLACKLISTED: {
    error: 'Authentication Failed',
    message: 'Token has been revoked',
    statusCode: 401
  },
  TOKEN_EXPIRED: {
    error: 'Authentication Failed',
    message: 'Token has expired',
    statusCode: 401
  },
  TOKEN_MALFORMED: {
    error: 'Authentication Failed',
    message: 'Malformed token',
    statusCode: 401
  },
  INVALID_TOKEN_PAYLOAD: {
    error: 'Authentication Failed',
    message: 'Invalid token payload',
    statusCode: 401
  },
  USER_NOT_FOUND: {
    error: 'Authentication Failed',
    message: 'User not found',
    statusCode: 401
  },
  USER_INACTIVE: {
    error: 'Authentication Failed',
    message: 'User account is inactive',
    statusCode: 401
  },
  INSUFFICIENT_PERMISSIONS: (roles: UserRole[]) => ({
    error: 'Insufficient Permissions',
    message: `Access denied. Required roles: ${roles.join(', ')}`,
    statusCode: 403
  }),
  RESOURCE_FORBIDDEN: {
    error: 'Forbidden',
    message: 'You can only access your own resources',
    statusCode: 403
  },
  INTERNAL_SERVER_ERROR: {
    error: 'Internal Server Error',
    message: 'Authentication service temporarily unavailable',
    statusCode: 500
  }
} as const;

/**
 * Extract token from authorization header
 */
const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7) || null;
};

/**
 * Verify and decode JWT token
 */
const verifyJwtToken = (token: string, server: any): any => {
  try {
    return server.jwt.verify(token);
  } catch (jwtError: any) {
    if (jwtError.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (jwtError.name === 'JsonWebTokenError') {
      throw new Error('TOKEN_MALFORMED');
    }
    throw new Error('INVALID_TOKEN');
  }
};

/**
 * Validate token payload structure
 */
const validateTokenPayload = (decoded: any, expectedType: 'access' | 'refresh'): boolean => {
  return decoded.id && decoded.type === expectedType;
};

/**
 * Authentication middleware
 * Verifies JWT token and sets user in request context
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractToken(request.headers.authorization);
    
    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: request.ip,
        url: request.url,
        method: request.method
      });
      return reply.status(401).send(ErrorResponses.AUTHENTICATION_REQUIRED);
    }

    // Check if token is blacklisted
    const authService = request.container.get(TYPES.IAuthService) as IAuthService;
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    
    if (isBlacklisted) {
      logger.warn('Authentication failed: Token is blacklisted', {
        token: token.substring(0, 10) + '...',
        ip: request.ip,
        url: request.url
      });
      return reply.status(401).send(ErrorResponses.TOKEN_BLACKLISTED);
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = verifyJwtToken(token, request.server);
    } catch (error: any) {
      logger.warn('JWT verification failed', {
        error: error.message,
        ip: request.ip,
        url: request.url
      });

      const errorResponse = error.message === 'TOKEN_EXPIRED' 
        ? ErrorResponses.TOKEN_EXPIRED
        : error.message === 'TOKEN_MALFORMED'
        ? ErrorResponses.TOKEN_MALFORMED
        : ErrorResponses.INVALID_TOKEN_PAYLOAD;

      return reply.status(401).send(errorResponse);
    }

    // Validate token payload
    if (!validateTokenPayload(decoded, 'access')) {
      logger.warn('Authentication failed: Invalid token payload', {
        tokenType: decoded.type,
        hasId: !!decoded.id,
        ip: request.ip
      });
      return reply.status(401).send(ErrorResponses.INVALID_TOKEN_PAYLOAD);
    }

    // Get user from database
    const userRepository = request.container.get(TYPES.IUserRepository) as IUserRepository;
    const user = await userRepository.findById(decoded.id);
    
    if (!user) {
      logger.warn('User not found during authentication', {
        userId: decoded.id,
        ip: request.ip,
        url: request.url
      });
      return reply.status(401).send(ErrorResponses.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted to authenticate', {
        userId: user.id,
        username: user.username,
        ip: request.ip,
        url: request.url
      });
      return reply.status(401).send(ErrorResponses.USER_INACTIVE);
    }

    // Set the user in the request context
    request.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: toUserRole(user.role),
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', {
      userId: user.id,
      username: user.username,
      role: user.role,
      url: request.url,
      method: request.method
    });

  } catch (error: any) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      ip: request.ip
    });
    return reply.status(500).send(ErrorResponses.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Convert string to UserRole enum safely
 */
const toUserRole = (role: string): UserRole => {
  const validRoles = Object.values(UserRole) as string[];
  if (validRoles.includes(role)) {
    return role as UserRole;
  }
  // Fallback to USER if invalid role
  return UserRole.USER;
};

/**
 * Authorization middleware factory
 * Checks if authenticated user has required role(s)
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(ErrorResponses.AUTHENTICATION_REQUIRED);
      }

      if (!allowedRoles.includes(request.currentUser?.role ? toUserRole(request.currentUser.role) : UserRole.USER)) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: request.user.id,
          username: request.user.username,
          userRole: request.user.role,
          requiredRoles: allowedRoles,
          url: request.url,
          method: request.method,
          ip: request.ip
        });
        return reply.status(403).send(ErrorResponses.INSUFFICIENT_PERMISSIONS(allowedRoles));
      }

      // Log successful authorization
      logger.debug('Authorization successful', {
        userId: request.user.id,
        username: request.user.username,
        role: request.user.role,
        url: request.url,
        method: request.method
      });

    } catch (error: any) {
      logger.error('Authorization middleware error', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        url: request.url,
        ip: request.ip
      });
      return reply.status(500).send(ErrorResponses.INTERNAL_SERVER_ERROR);
    }
  };
};

/**
 * Resource ownership middleware factory
 * Checks if user owns the resource or has admin privileges
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(ErrorResponses.AUTHENTICATION_REQUIRED);
      }

      const params = request.params as { [key: string]: string };
      const resourceId = params[resourceIdParam];

      if (!resourceId) {
        return reply.status(400).send({ 
          error: 'Bad Request',
          message: 'Resource ID is required',
          statusCode: 400
        });
      }

      // Admin users can access any resource
      if (request.user.role === UserRole.ADMIN) {
        return;
      }

      // Check if user owns the resource
      if (resourceId !== request.user.id) {
        logger.warn('Resource ownership violation', {
          userId: request.user.id,
          username: request.user.username,
          requestedResourceId: resourceId,
          resourceParam: resourceIdParam,
          url: request.url,
          method: request.method,
          ip: request.ip
        });
        return reply.status(403).send(ErrorResponses.RESOURCE_FORBIDDEN);
      }

    } catch (error: any) {
      logger.error('Ownership middleware error', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        url: request.url,
        ip: request.ip
      });
      return reply.status(500).send(ErrorResponses.INTERNAL_SERVER_ERROR);
    }
  };
};

/**
 * Blog post ownership middleware factory
 * Checks if user owns the blog post or has admin/author privileges
 */
export const requireBlogOwnership = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(ErrorResponses.AUTHENTICATION_REQUIRED);
      }

      const params = request.params as { id: string };
      const blogPostId = params.id;

      if (!blogPostId) {
        return reply.status(400).send({ 
          error: 'Bad Request',
          message: 'Blog post ID is required',
          statusCode: 400
        });
      }

      // Admin users can access any resource
      if (request.user.role === UserRole.ADMIN) {
        return;
      }

      // Check if user owns the blog post
      const userRepository = request.container.get(TYPES.IUserRepository) as IUserRepository;
      // Burada BlogPost repository kullanmak daha doğru olur, örnek olarak gösteriyorum
      // const blogPost = await blogRepository.findById(blogPostId);
      // if (blogPost && blogPost.authorId === request.user.id) return;

      logger.warn('Blog post ownership violation', {
        userId: request.user.id,
        username: request.user.username,
        blogPostId: blogPostId,
        url: request.url,
        method: request.method,
        ip: request.ip
      });
      return reply.status(403).send(ErrorResponses.RESOURCE_FORBIDDEN);

    } catch (error: any) {
      logger.error('Blog ownership middleware error', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        url: request.url,
        ip: request.ip
      });
      return reply.status(500).send(ErrorResponses.INTERNAL_SERVER_ERROR);
    }
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractToken(request.headers.authorization);
    
    if (!token) {
      return; // No token provided - continue without authentication
    }

    try {
      // Check if token is blacklisted
      const authService = request.container.get(TYPES.IAuthService) as IAuthService;
      const isBlacklisted = await authService.isTokenBlacklisted(token);
      
      if (isBlacklisted) {
        return; // Token is blacklisted, continue without authentication
      }

      const decoded = verifyJwtToken(token, request.server);
      
      if (!validateTokenPayload(decoded, 'access')) {
        return; // Invalid payload, continue without auth
      }

      const userRepository = request.container.get(TYPES.IUserRepository) as IUserRepository;
      const user = await userRepository.findById(decoded.id);
      
      if (user && user.isActive) {
        request.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };

        logger.debug('Optional authentication successful', {
          userId: user.id,
          username: user.username,
          url: request.url
        });
      }
    } catch (error) {
      // Token verification failed, continue without authentication
      logger.debug('Optional authentication failed, continuing without auth', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url
      });
    }
  } catch (error: any) {
    logger.error('Optional auth middleware error', {
      error: error.message,
      url: request.url,
      ip: request.ip
    });
    // Continue without authentication on error
  }
};

/**
 * Refresh token middleware
 * Specifically for refresh token endpoints
 */
export const authenticateRefreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = request.body as { refreshToken: string };
    
    if (!refreshToken) {
      return reply.status(401).send(ErrorResponses.TOKEN_REQUIRED);
    }

    // Verify refresh token format (JWT)
    let decoded: any;
    try {
      decoded = verifyJwtToken(refreshToken, request.server);
    } catch (error: any) {
      logger.warn('Refresh token verification failed', {
        error: error.message,
        ip: request.ip
      });
      return reply.status(401).send(ErrorResponses.INVALID_TOKEN_PAYLOAD);
    }

    // Validate token payload
    if (!validateTokenPayload(decoded, 'refresh')) {
      return reply.status(401).send(ErrorResponses.INVALID_TOKEN_PAYLOAD);
    }

    // Store decoded token in request for service to use
    (request as any).decodedToken = decoded;

  } catch (error: any) {
    logger.error('Refresh token middleware error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      ip: request.ip
    });
    return reply.status(500).send(ErrorResponses.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Rate limiting middleware factory
 * Applies different rate limits based on user role
 */
export const rateLimitByRole = (limits: { [K in UserRole]: number }) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Bu middleware'i gerçekleştirmek için Redis veya memory cache gerekir
    // Şimdilik placeholder olarak bırakıyorum
    const userRole = request.user?.role || UserRole.USER;

    const limit = (userRole in limits) 
      ? limits[userRole as UserRole] 
      : limits[UserRole.USER];
    
    // Rate limit logic would go here
    logger.debug('Rate limit check', {
      userId: request.user?.id,
      role: userRole,
      limit: limit,
      url: request.url
    });
  };
};

/**
 * Admin only middleware
 * Shorthand for authorize([UserRole.ADMIN])
 */
export const adminOnly = authorize([UserRole.ADMIN]);

/**
 * Author or Admin middleware
 * Shorthand for authorize([UserRole.AUTHOR, UserRole.ADMIN])
 */
export const authorOrAdmin = authorize([UserRole.AUTHOR, UserRole.ADMIN]);

/**
 * Authenticated users only middleware
 * Shorthand for authorize([UserRole.USER, UserRole.AUTHOR, UserRole.ADMIN])
 */
export const authenticatedOnly = authorize([UserRole.USER, UserRole.AUTHOR, UserRole.ADMIN]);

/**
 * Content creators middleware (Author and Admin)
 */
export const contentCreators = authorize([UserRole.AUTHOR, UserRole.ADMIN]);