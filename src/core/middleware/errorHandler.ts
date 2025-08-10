import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../utils/logger';
import { BaseError } from '../../core/errors';
import { ErrorResponse } from '../interfaces/responses/ErrorResponse';



/**
 * Global error handler for Fastify
 * Handles both custom BaseError instances and generic errors
 */
export const errorHandler = (
  error: FastifyError | BaseError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const requestId = (request as any).id;
  const timestamp = new Date().toISOString();
  const path = request.url;

  let statusCode: number;
  let errorName: string;
  let message: string;
  let errorCode: string | undefined;
  let details: any;

  // Handle custom BaseError instances first
  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    errorName = error.name;
    message = error.message;
    errorCode = error.code;
    details = error.context;

    // Log operational errors as warnings
    logger.warn('Operational error occurred', {
      error: error.toJSON(),
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
      requestId,
      body: request.body,
      params: request.params,
      query: request.query
    });
  } else {
    // Handle Fastify and other errors
    
    // Log all non-operational errors as errors
    logger.error('Request error occurred', {
      error: error.message,
      stack: error.stack,
      statusCode: (error as FastifyError).statusCode,
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
      requestId,
      body: request.body,
      params: request.params,
      query: request.query
    });

    if ((error as FastifyError).validation) {
      // Validation errors (from Joi or Fastify schema validation)
      statusCode = 400;
      errorName = 'Validation Error';
      message = 'Request validation failed';
      errorCode = 'VALIDATION_FAILED';
      details = (error as FastifyError).validation!.map(err => ({
        field: err.instancePath || err.schemaPath || 'unknown',
        message: err.message || 'Validation failed',
        keyword: err.keyword,
        params: err.params
      }));
    } else if (error.message.includes('jwt') || error.message.includes('JWT')) {
      // JWT related errors
      statusCode = 401;
      errorName = 'Authentication Error';
      message = 'Invalid or expired token';
      errorCode = 'TOKEN_INVALID';
    } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      statusCode = 401;
      errorName = 'Authentication Error';
      message = 'Authentication required';
      errorCode = 'UNAUTHORIZED';
    } else if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
      statusCode = 403;
      errorName = 'Forbidden';
      message = 'Access denied';
      errorCode = 'FORBIDDEN';
    } else if (error.message.includes('not found') || error.message.includes('Not found')) {
      statusCode = 404;
      errorName = 'Not Found';
      message = 'Resource not found';
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (error.message.includes('Prisma') || error.message.includes('prisma')) {
      // Database errors
      statusCode = 500;
      errorName = 'Database Error';
      message = 'A database error occurred';
      errorCode = 'DATABASE_ERROR';
      
      // Don't expose sensitive database information in production
      if (process.env.NODE_ENV === 'development') {
        details = { 
          database: error.message 
        };
      }
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      // Network/connection errors
      statusCode = 503;
      errorName = 'Service Unavailable';
      message = 'External service temporarily unavailable';
      errorCode = 'SERVICE_UNAVAILABLE';
    } else if (error.message.includes('File too large') || error.message.includes('Payload too large')) {
      // File upload errors
      statusCode = 413;
      errorName = 'Payload Too Large';
      message = 'File size exceeds maximum allowed limit';
      errorCode = 'FILE_TOO_LARGE';
    } else if (error.message.includes('Unsupported Media Type')) {
      // Media type errors
      statusCode = 415;
      errorName = 'Unsupported Media Type';
      message = 'File type not supported';
      errorCode = 'UNSUPPORTED_MEDIA_TYPE';
    } else if ((error as FastifyError).statusCode) {
      // HTTP errors with status codes
      statusCode = (error as FastifyError).statusCode!;
      errorName = getErrorNameByStatus(statusCode);
      message = error.message || 'An error occurred';
      errorCode = getErrorCodeByStatus(statusCode);
    } else {
      // Unknown errors
      statusCode = 500;
      errorName = 'Internal Server Error';
      message = 'An unexpected error occurred';
      errorCode = 'INTERNAL_SERVER_ERROR';
      
      // Log additional context for unknown errors
      logger.error('Unknown error type encountered', {
        errorName: error.name,
        errorConstructor: error.constructor.name,
        errorKeys: Object.keys(error),
        requestId
      });
    }
  }

  // Ensure we don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      message = 'Internal Server Error';
      details = undefined;
    }
  }

  const errorResponse: ErrorResponse = {
    error: errorName,
    message,
    statusCode,
    timestamp,
    path,
    requestId
  };

  if (errorCode) {
    errorResponse.code = errorCode;
  }

  if (details) {
    errorResponse.details = details;
  }

  // Set security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');

  // Send error response
  return reply.status(statusCode).send(errorResponse);
};

/**
 * Get error name by HTTP status code
 */
function getErrorNameByStatus(statusCode: number): string {
  const statusCodeMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };

  return statusCodeMap[statusCode] || 'Unknown Error';
}

/**
 * Get error code by HTTP status code
 */
function getErrorCodeByStatus(statusCode: number): string {
  const statusCodeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };

  return statusCodeMap[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Not found handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request as any).id;

  logger.warn('Route not found', {
    url: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id,
    requestId
  });

  return reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    code: 'ROUTE_NOT_FOUND',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: request.url,
    requestId
  });
};

/**
 * Rate limit error handler
 * Handles rate limiting errors
 */
export const rateLimitErrorHandler = (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request as any).id;

  logger.warn('Rate limit exceeded', {
    ip: request.ip,
    url: request.url,
    method: request.method,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id,
    requestId
  });

  return reply.status(429).send({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    path: request.url,
    requestId,
    retryAfter: '60 seconds'
  });
};