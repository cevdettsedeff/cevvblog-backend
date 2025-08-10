import { BaseError, ErrorCode } from "..";

export class NotFoundError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, true, context);
  }
}