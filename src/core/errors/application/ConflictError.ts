import { BaseError, ErrorCode } from "..";

export class ConflictError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.RESOURCE_CONFLICT, 409, true, context);
  }
}