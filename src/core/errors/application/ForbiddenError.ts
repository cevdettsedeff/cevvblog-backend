import { BaseError, ErrorCode } from "..";

export class ForbiddenError extends BaseError {
  constructor(
    message: string = 'Access forbidden',
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.FORBIDDEN, 403, true, context);
  }
}