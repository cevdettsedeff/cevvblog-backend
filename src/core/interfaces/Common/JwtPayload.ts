import { UserRole } from "../../../domain/enums/UserRole";

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;  // issued at
  exp?: number;  // expiration time
  iss?: string;  // issuer
  aud?: string;  // audience
}