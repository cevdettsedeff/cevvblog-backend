import { ErrorCode } from "../../../domain/enums/ErrorCode";
import { BaseError } from "../BaseError";

export class DatabaseError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, context);
  }

  static connectionFailed(details?: string): DatabaseError {
    return new DatabaseError(
      'Database connection failed',
      { details, type: 'connection' }
    );
  }

  static queryFailed(query: string, error: string): DatabaseError {
    return new DatabaseError(
      'Database query failed',
      { query, error, type: 'query' }
    );
  }

  static transactionFailed(operation: string): DatabaseError {
    return new DatabaseError(
      'Database transaction failed',
      { operation, type: 'transaction' }
    );
  }

  static constraintViolation(constraint: string, details?: string): DatabaseError {
    return new DatabaseError(
      'Database constraint violation',
      { constraint, details, type: 'constraint' }
    );
  }

  static timeout(operation: string): DatabaseError {
    return new DatabaseError(
      'Database operation timeout',
      { operation, type: 'timeout' }
    );
  }
}