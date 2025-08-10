import { ErrorCode } from "../../../domain/enums/ErrorCode";
import { BaseError } from "../BaseError";

export class FileSystemError extends BaseError {
  public readonly filePath?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    filePath?: string,
    operation?: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.FILE_SYSTEM_ERROR, 500, true, {
      filePath,
      operation,
      ...context
    });
    
    this.filePath = filePath;
    this.operation = operation;
  }

  static fileNotFound(filePath: string): FileSystemError {
    return new FileSystemError(
      `File not found: ${filePath}`,
      filePath,
      'read',
      { type: 'not_found' }
    );
  }

  static permissionDenied(filePath: string, operation: string): FileSystemError {
    return new FileSystemError(
      `Permission denied for ${operation} operation on: ${filePath}`,
      filePath,
      operation,
      { type: 'permission_denied' }
    );
  }

  static diskFull(filePath?: string): FileSystemError {
    return new FileSystemError(
      'Disk space full',
      filePath,
      'write',
      { type: 'disk_full' }
    );
  }

  static invalidPath(filePath: string): FileSystemError {
    return new FileSystemError(
      `Invalid file path: ${filePath}`,
      filePath,
      undefined,
      { type: 'invalid_path' }
    );
  }

  static corruptedFile(filePath: string): FileSystemError {
    return new FileSystemError(
      `File is corrupted: ${filePath}`,
      filePath,
      'read',
      { type: 'corrupted' }
    );
  }

  static uploadFailed(filePath: string, reason?: string): FileSystemError {
    return new FileSystemError(
      `File upload failed: ${filePath}`,
      filePath,
      'upload',
      { type: 'upload_failed', reason }
    );
  }
}