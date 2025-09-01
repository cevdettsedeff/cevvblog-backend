import { FastifyRequest } from "fastify";
import { AuthenticatedUser } from "../core/interfaces/Common/auth/AuthenticatedUser";

export interface AuthenticatedRequest extends FastifyRequest {
  currentUser?: AuthenticatedUser;
}

// Middleware'de kullanım için type guard
export function isAuthenticatedRequest(req: FastifyRequest): req is AuthenticatedRequest {
  return 'currentUser' in req && (req as AuthenticatedRequest).currentUser !== undefined;
}

// Helper function - request'ten user bilgilerini güvenli şekilde almak için
export function getCurrentUser(req: FastifyRequest): AuthenticatedUser | null {
  const authReq = req as AuthenticatedRequest;
  return authReq.currentUser || null;
}

// Type assertion helper
export function assertAuthenticatedRequest(req: FastifyRequest): AuthenticatedRequest {
  if (!isAuthenticatedRequest(req)) {
    throw new Error('Request is not authenticated');
  }
  return req;
}