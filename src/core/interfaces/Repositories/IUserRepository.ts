import { RefreshToken, TokenBlacklist, User } from "@prisma/client";
import { IRepository } from "../IRepository";

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAuthors(): Promise<User[]>;
  updateLastLogin(id: string): Promise<void>;
  findActiveUsers(): Promise<User[]>;

  // New refresh token methods
  createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<(RefreshToken & { user: User }) | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllRefreshTokens(userId: string): Promise<void>;
  cleanupExpiredRefreshTokens(): Promise<void>;

  // New blacklist methods 
  createBlacklistedToken(data: {
    token: string;
    userId?: string | null; 
    expiresAt: Date;
  }): Promise<TokenBlacklist>;
  findBlacklistedToken(token: string): Promise<TokenBlacklist | null>;
  isTokenBlacklisted(token: string): Promise<boolean>; // Bu eksikti
  cleanupExpiredBlacklistedToken(tokenId: string): Promise<void>;
  cleanupExpiredBlacklistedTokens(): Promise<void>;
}