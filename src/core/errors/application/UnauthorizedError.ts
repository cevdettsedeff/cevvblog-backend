import { BaseError, ErrorCode } from "..";

export class UnauthorizedError extends BaseError {
  constructor(
    message: string = 'Authentication required',
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}