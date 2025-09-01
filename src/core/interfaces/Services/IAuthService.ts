import { AuthResponseDto } from "../../../application/dtos/auth/AuthResponseDto";
import { LoginDto } from "../../../application/dtos/auth/LoginDto";
import { RegisterDto } from "../../../application/dtos/auth/RegisterDto";
import { User } from '@prisma/client';

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthResponseDto | null>;
  register(dto: RegisterDto): Promise<AuthResponseDto>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; } | null>;
  logout(accessToken: string, refreshToken?: string): Promise<void>;
  logoutAll(userId: string, currentAccessToken: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  validateAccessToken(token: string): Promise<User | null>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
}