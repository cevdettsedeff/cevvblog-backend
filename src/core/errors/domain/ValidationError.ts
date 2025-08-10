import { BaseError, ErrorCode } from "..";

export class ValidationError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.VALIDATION_FAILED, 400, true, context);
  }
}