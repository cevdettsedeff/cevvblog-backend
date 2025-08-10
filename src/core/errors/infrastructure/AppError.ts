import { ErrorCode } from "../../../domain/enums/ErrorCode";
import { BaseError } from "../BaseError";

export class AppError extends BaseError {
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    context?: Record<string, any>
  ) {
    super(message, errorCode, statusCode, true, context);
  }

  // Static factory methods for common errors
  static badRequest(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 400, ErrorCode.INVALID_INPUT, context);
  }

  static unauthorized(message: string = 'Unauthorized', context?: Record<string, any>): AppError {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED, context);
  }

  static forbidden(message: string = 'Forbidden', context?: Record<string, any>): AppError {
    return new AppError(message, 403, ErrorCode.FORBIDDEN, context);
  }

  static notFound(message: string = 'Resource not found', context?: Record<string, any>): AppError {
    return new AppError(message, 404, ErrorCode.RESOURCE_NOT_FOUND, context);
  }

  static conflict(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 409, ErrorCode.RESOURCE_ALREADY_EXISTS, context);
  }

  static validationError(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 422, ErrorCode.VALIDATION_ERROR, context);
  }

  static internal(message: string = 'Internal server error', context?: Record<string, any>): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, context);
  }
}