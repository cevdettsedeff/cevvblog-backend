import { FastifyInstance } from "fastify";
import { RegisterDto } from "../dtos/auth/RegisterDto";
import { AuthResponseDto } from "../dtos/auth/AuthResponseDto";
import { LoginDto } from "../dtos/auth/LoginDto";
import { IAuthService } from "../../core/interfaces/Services/IAuthService";
import { IUserRepository } from "../../core/interfaces/Repositories/IUserRepository ";
import { inject, injectable } from "inversify";
import { TYPES } from "../../core/container/types";
const bcrypt = require('bcryptjs');
import { config } from "../../config/env";
import { UserRole } from "../../domain/enums/UserRole";
import { ConflictError, ForbiddenError, UnauthorizedError } from "../../core/errors";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto | null> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return null; // User not found
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ForbiddenError('Account is deactivated', { userId: user.id });
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(dto.password, user.password);
    if (!isValidPassword) {
      return null; // Invalid password
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      token: '', // Will be set in controller
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists', { email: dto.email });
    }
    
    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictError('Username already exists', { username: dto.username });
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    const userData = {
      ...dto,
      password: hashedPassword,
      role: UserRole.USER,
    };

    const user = await this.userRepository.create(userData);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      token: '', // Will be set in controller
    };
  }

  generateToken(userId: string, fastify: FastifyInstance): string {
    return fastify.jwt.sign(
      { id: userId },
      { expiresIn: config.jwt.expiresIn }
    );
  }

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}