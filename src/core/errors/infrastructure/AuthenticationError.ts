import { ErrorCode } from "../../../domain/enums/ErrorCode";
import { BaseError } from "../BaseError";

export class AuthenticationError extends BaseError {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.UNAUTHORIZED,
    context?: Record<string, any>
  ) {
    super(message, errorCode, 401, true, context);
  }

  static invalidCredentials(context?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(
      'Invalid credentials provided',
      ErrorCode.INVALID_CREDENTIALS,
      context
    );
  }

  static tokenExpired(context?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(
      'Token has expired',
      ErrorCode.TOKEN_EXPIRED,
      context
    );
  }

  static tokenInvalid(context?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(
      'Invalid token provided',
      ErrorCode.TOKEN_INVALID,
      context
    );
  }

  static accountLocked(context?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(
      'Account is locked',
      ErrorCode.OPERATION_NOT_ALLOWED,
      context
    );
  }
}
