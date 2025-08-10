import { FastifyRequest, FastifyReply } from 'fastify';
import { TYPES } from '../container/types';
import logger from '../../utils/logger';
import { IUserRepository } from '../interfaces/Repositories/IUserRepository ';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ 
        error: 'Authentication Required',
        message: 'No valid authorization header provided',
        statusCode: 401
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    if (!token) {
      return reply.status(401).send({ 
        error: 'Authentication Required',
        message: 'No token provided',
        statusCode: 401
      });
    }

    let decoded: any;
    try {
      // Verify JWT token using Fastify JWT plugin
      decoded = request.server.jwt.verify(token);
    } catch (jwtError: any) {
      logger.warn('JWT verification failed', {
        error: jwtError.message,
        token: token.substring(0, 20) + '...',
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });

      let message = 'Invalid token';
      if (jwtError.message.includes('expired')) {
        message = 'Token has expired';
      } else if (jwtError.message.includes('malformed')) {
        message = 'Malformed token';
      }

      return reply.status(401).send({ 
        error: 'Authentication Failed',
        message,
        statusCode: 401
      });
    }

    // Use the id from JWT payload (matching your JWT structure)
    if (!decoded.id && !decoded.userId) {
      return reply.status(401).send({ 
        error: 'Authentication Failed',
        message: 'Invalid token payload',
        statusCode: 401
      });
    }

    const userId = decoded.id || decoded.userId;

    // Get user repository from container (fix type issue)
    const userRepository = request.container.get(TYPES.IUserRepository) as IUserRepository;
    const user = await userRepository.findById(userId);
    
    if (!user) {
      logger.warn('User not found during authentication', {
        userId: userId,
        ip: request.ip
      });

      return reply.status(401).send({ 
        error: 'Authentication Failed',
        message: 'User not found',
        statusCode: 401
      });
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted to authenticate', {
        userId: user.id,
        username: user.username,
        ip: request.ip
      });

      return reply.status(401).send({ 
        error: 'Authentication Failed',
        message: 'User account is inactive',
        statusCode: 401
      });
    }

    // Set the user in the JWT context (this will be available as request.user)
    request.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: request.ip
    });

  } catch (error: any) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: request.ip,
      url: request.url
    });

    return reply.status(500).send({ 
      error: 'Internal Server Error',
      message: 'Authentication service temporarily unavailable',
      statusCode: 500
    });
  }
};

/**
 * Role-based authorization middleware factory
 * Returns a middleware function that checks if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is authenticated
      if (!request.user) {
        logger.warn('Role check attempted without authentication', {
          url: request.url,
          method: request.method,
          ip: request.ip
        });

        return reply.status(401).send({ 
          error: 'Authentication Required',
          message: 'You must be logged in to access this resource',
          statusCode: 401
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(request.user.role)) {
        logger.warn('Insufficient permissions', {
          userId: request.user.id,
          username: request.user.username,
          userRole: request.user.role,
          requiredRoles: allowedRoles,
          url: request.url,
          method: request.method,
          ip: request.ip
        });

        return reply.status(403).send({ 
          error: 'Insufficient Permissions',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          statusCode: 403
        });
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

      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Authorization service temporarily unavailable',
        statusCode: 500
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header provided - continue without authentication
      return;
    }

    const token = authHeader.slice(7);
    
    if (!token) {
      // No token provided - continue without authentication
      return;
    }

    try {
      const decoded = request.server.jwt.verify(token) as any;
      const userId = decoded.id || decoded.userId;
      
      if (userId) {
        const userRepository = request.container.get(TYPES.IUserRepository) as IUserRepository;
        const user = await userRepository.findById(userId);
        
        if (user && user.isActive) {
          request.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          };
        }
      }
    } catch (jwtError) {
      // Invalid token - continue without authentication
      logger.debug('Optional auth: Invalid token provided', {
        ip: request.ip,
        url: request.url
      });
    }

  } catch (error: any) {
    // Log error but don't block request
    logger.error('Optional auth middleware error', {
      error: error.message,
      ip: request.ip,
      url: request.url
    });
  }
};

/**
 * Resource ownership middleware factory
 * Checks if user owns the resource or has admin privileges
 */
export const requireOwnership = (resourceIdParam: string = 'id', allowedRoles: string[] = ['ADMIN']) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ 
          error: 'Authentication Required',
          message: 'You must be logged in to access this resource',
          statusCode: 401
        });
      }

      const params = request.params as any;
      const resourceId = params[resourceIdParam];
      
      if (!resourceId) {
        return reply.status(400).send({ 
          error: 'Bad Request',
          message: `Missing ${resourceIdParam} parameter`,
          statusCode: 400
        });
      }

      // Admin users can access any resource
      if (allowedRoles.includes(request.user.role)) {
        return;
      }

      // Check if user owns the resource (assuming userId matches resource owner)
      if (resourceId !== request.user.id) {
        logger.warn('Resource ownership violation', {
          userId: request.user.id,
          username: request.user.username,
          requestedResourceId: resourceId,
          url: request.url,
          method: request.method,
          ip: request.ip
        });

        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'You can only access your own resources',
          statusCode: 403
        });
      }

    } catch (error: any) {
      logger.error('Ownership middleware error', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        url: request.url,
        ip: request.ip
      });

      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Authorization service temporarily unavailable',
        statusCode: 500
      });
    }
  };
};

// Updated Auth Service to match JWT payload structure (application/services/AuthService.ts)
export const generateToken = (userId: string, fastify: any): string => {
  return fastify.jwt.sign(
    { 
      id: userId, // Use 'id' to match your type definition
      // You can add more fields here if needed
    },
    { 
      expiresIn: '7d' // or get from config
    }
  );
};