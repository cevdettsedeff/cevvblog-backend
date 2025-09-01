// src/application/services/AuthService.ts
import { inject, injectable } from "inversify";
import { TYPES } from "../../core/container/types";
import { IAuthService } from "../../core/interfaces/Services/IAuthService";
import { LoginDto } from "../dtos/auth/LoginDto";
import { RegisterDto } from "../dtos/auth/RegisterDto";
import { AuthResponseDto } from "../dtos/auth/AuthResponseDto";
import { User, UserRole } from "@prisma/client";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../core/errors";
import logger from "../../utils/logger";
import * as jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { IUserRepository } from "../../core/interfaces/Repositories/IUserRepository";
const bcrypt = require("bcryptjs");

type AccessTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  username: string;
  role: string; // JWT'de string olarak saklanır
  type: "access";
};

type RefreshTokenPayload = JwtPayload & {
  userId: string;
  type: "refresh";
};

@injectable()
export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET! || "your-jwt-secret-key" as string;
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN! || "15m" as string;
  private readonly REFRESH_TOKEN_SECRET: string =
    process.env.REFRESH_TOKEN_SECRET! || process.env.JWT_SECRET! || "your-jwt-secret-key" as string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: string =
    process.env.REFRESH_TOKEN_EXPIRES_IN! || "7d" as string;

  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository
  ) 
  {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password, firstName, lastName } = registerDto;

    // Email & username benzersizlik kontrolleri
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
    ]);

    if (existingEmail) throw new ConflictError("Email already exists", { email });
    if (existingUsername)
      throw new ConflictError("Username already exists", { username });

    // Şifreyi hash'le
    const hashedPassword = await this.hashPassword(password);

    // Kullanıcı oluştur
    const user = await this.userRepository.create({
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: UserRole.USER,
      isActive: true,
    });

    // Tokenlar
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar || undefined,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError("Invalid email or password");

    if (!user.isActive) throw new ForbiddenError("Account is deactivated");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError("Invalid email or password");

    await Promise.all([
      this.userRepository.updateLastLogin(user.id),
      this.userRepository.revokeAllRefreshTokens(user.id),
    ]);

    const accessToken = this.generateAccessToken(user);
const refreshToken = await this.generateRefreshToken(user.id);

console.log('Generated tokens:', { accessToken, refreshToken }); // Debug log

logger.info("User logged in successfully", {
  userId: user.id,
  email: user.email,
});

const response = {
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar || undefined,
  },
  accessToken,
  refreshToken,
};

console.log('Login response:', response); // Debug log

return response;
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    // DB'de refresh token var mı
    const tokenData = await this.userRepository.findRefreshToken(refreshToken);
    if (!tokenData) return null;

    if (tokenData.revoked) return null;

    // Süresi dolmuş mu
    if (new Date() > tokenData.expiresAt) {
      await this.userRepository.revokeRefreshToken(refreshToken);
      return null;
    }

    // JWT olarak doğrula ve type kontrolü yap
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        this.REFRESH_TOKEN_SECRET
      ) as RefreshTokenPayload;
      if (decoded.type !== "refresh") {
        await this.userRepository.revokeRefreshToken(refreshToken);
        return null;
      }
    } catch (err) {
      await this.userRepository.revokeRefreshToken(refreshToken);
      return null;
    }

    // Kullanıcının aktifliği
    if (!tokenData.user.isActive) {
      await this.userRepository.revokeRefreshToken(refreshToken);
      return null;
    }

    // Eski refresh'i iptal et → rotate
    await this.userRepository.revokeRefreshToken(refreshToken);

    // Yeni tokenlar
    const user = tokenData.user;
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    logger.info("Tokens refreshed successfully", { userId: user.id });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    // Access token'ı blacklist'e ekle
    await this.blacklistToken(accessToken);

    // Refresh token varsa iptal et
    if (refreshToken) {
      await this.userRepository.revokeRefreshToken(refreshToken);
    }

    logger.info("User logged out successfully");
  }

  async logoutAll(userId: string, currentAccessToken: string): Promise<void> {
    await Promise.all([
      this.blacklistToken(currentAccessToken, userId),
      this.userRepository.revokeAllRefreshTokens(userId),
    ]);

    logger.info("User logged out from all devices", { userId });
  }

  async validateAccessToken(token: string): Promise<User | null> {
    try {
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) return null;

      const decoded = jwt.verify(token, this.JWT_SECRET) as AccessTokenPayload;
      if (decoded.type !== "access") return null;

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) return null;

      return user;
    } catch (error) {
      const msg =
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : String(error);
      logger.warn("Invalid access token", { error: msg });
      return null;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid)
      throw new ValidationError("Current password is incorrect");

    // aynı şifre mi
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword)
      throw new ValidationError(
        "New password must be different from current password"
      );

    const hashedNewPassword = await this.hashPassword(newPassword);

    await Promise.all([
      this.userRepository.update(userId, { password: hashedNewPassword }),
      this.userRepository.revokeAllRefreshTokens(userId),
    ]);

    logger.info("Password changed successfully", { userId });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn("Password reset requested for non-existent email", { email });
      return;
    }

    logger.info("Password reset requested", { userId: user.id, email });
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await Promise.all([
        this.userRepository.cleanupExpiredRefreshTokens(),
        this.userRepository.cleanupExpiredBlacklistedTokens(),
      ]);
      logger.info("Expired tokens cleaned up successfully");
    } catch (error) {
      logger.error("Error cleaning up expired tokens", { error });
    }
  }

  // ========== PRIVATE HELPERS ==========

  private generateAccessToken(user: User): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    type: "access",
  };

  return jwt.sign(
    payload, 
    this.JWT_SECRET as jwt.Secret, 
    {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: "blog-api",
      subject: user.id,
    } as jwt.SignOptions
  );
}

private async generateRefreshToken(userId: string): Promise<string> {
  const payload: RefreshTokenPayload = { userId, type: "refresh" };

  const token = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
    expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    issuer: "blog-api",
    subject: userId,
  } as jwt.SignOptions);

  // JWT'yi doğrulayarak exp değerini al
  const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
  const expiresAt = new Date(decoded.exp! * 1000);

  await this.userRepository.createRefreshToken({
    token,
    userId,
    expiresAt,
  });

  return token;
}

  private async blacklistToken(token: string, userId?: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      const expiresAt =
        decoded?.exp != null
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + this.addDurationMs(this.JWT_EXPIRES_IN));

      await this.userRepository.createBlacklistedToken({
        token,
        userId,
        expiresAt,
      });
    } catch (error) {
      logger.warn("Could not blacklist token", { error });
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.userRepository.isTokenBlacklisted(token);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private addDurationMs(duration: string): number {
    const match = /^(\d+)\s*(s|m|h|d)$/i.exec(duration.trim());
    if (!match) {
      const asNum = Number(duration);
      if (!Number.isNaN(asNum)) return asNum * 1000;
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult =
      unit === "s"
        ? 1000
        : unit === "m"
        ? 60 * 1000
        : unit === "h"
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    return value * mult;
  }
}