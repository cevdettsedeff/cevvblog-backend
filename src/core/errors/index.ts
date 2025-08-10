// src/core/errors/index.ts
// Base
export { BaseError } from './BaseError';
export { ErrorCode } from '../../domain/enums/ErrorCode';

// Application Layer
export { ConflictError } from './application/ConflictError';
export { NotFoundError } from './application/NotFoundError';
export { UnauthorizedError } from './application/UnauthorizedError';
export { ForbiddenError } from './application/ForbiddenError';

// Domain Layer
export { ValidationError } from './domain/ValidationError';

// Infrastructure Layer
export { DatabaseError } from './infrastructure/DatabaseError';
export { ExternalApiError } from './infrastructure/ExternalApiError';
export { FileSystemError } from './infrastructure/FileSystemError';
