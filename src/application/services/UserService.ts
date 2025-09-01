import { inject, injectable } from "inversify";
import { TYPES } from "../../core/container/types";
import { IUserService } from "../../core/interfaces/Services/IUserService";
import { CreateUserDto } from "../dtos/user/CreateUserDto";
import { UpdateUserDto } from "../dtos/user/UpdateUserDto";
import { UserResponseDto } from "../dtos/user/UserResponseDto";
import { User, UserRole } from "@prisma/client";
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError, 
  ForbiddenError 
} from "../../core/errors";
import logger from "../../utils/logger";
import { IFindAllOptions } from "../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../core/interfaces/Common/IPaginatedResult";
const bcrypt = require("bcryptjs");
import { IUserRepository } from "../../core/interfaces/Repositories/IUserRepository";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository
  ) {}

  // IService'den gelen metodlar
  async getById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }
    return this.mapToResponseDto(user);
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.findAll(options);
    return {
      data: result.data.map(user => this.mapToResponseDto(user)),
      pagination: result.pagination,
    };
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Email kontrolü
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictError('Email already exists', { email: dto.email });
    }

    // Username kontrolü
    const existingUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictError('Username already exists', { username: dto.username });
    }

    // Password hash
    const hashedPassword = await this.hashPassword(dto.password);

    const userData: Partial<User> = {
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
      bio: dto.bio || null,
      avatar: dto.avatar || null,
      role: dto.role || UserRole.USER,
      isActive: true,
    };

    const user = await this.userRepository.create(userData);
    logger.info('User created successfully', { 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    });

    return this.mapToResponseDto(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    // Kullanıcı var mı kontrol et
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found', { userId: id });
    }

    // Email değiştiriliyorsa, başka kullanıcıda var mı kontrol et
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(dto.email);
      if (emailExists && emailExists.id !== id) {
        throw new ConflictError('Email already exists', { email: dto.email });
      }
    }

    // Username değiştiriliyorsa, başka kullanıcıda var mı kontrol et
    if (dto.username && dto.username !== existingUser.username) {
      const usernameExists = await this.userRepository.findByUsername(dto.username);
      if (usernameExists && usernameExists.id !== id) {
        throw new ConflictError('Username already exists', { username: dto.username });
      }
    }

    // Password hash'leme
    const updateData: Partial<User> = { ...dto };
    if (dto.password) {
      updateData.password = await this.hashPassword(dto.password);
    }

    const user = await this.userRepository.update(id, updateData);
    logger.info('User updated successfully', { userId: user.id });

    return this.mapToResponseDto(user);
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    const deleted = await this.userRepository.delete(id);
    if (deleted) {
      logger.info('User deactivated successfully', { userId: id });
    }
    return deleted;
  }

  // IUserService'e özel metodlar
  async getByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapToResponseDto(user) : null;
  }

  async getByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByUsername(username);
    return user ? this.mapToResponseDto(user) : null;
  }

  async getAuthors(): Promise<UserResponseDto[]> {
    const authors = await this.userRepository.findAuthors();
    return authors.map((author: User) => this.mapToResponseDto(author));
  }

  async getActiveUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findActiveUsers();
    return users.map((user: User) => this.mapToResponseDto(user));
  }

  async getProfile(id: string): Promise<UserResponseDto> {
    return await this.getById(id); // DRY principle
  }

  async updateProfile(id: string, profileData: UpdateUserDto): Promise<UserResponseDto> {
    // Profile güncelleme için hassas alanları çıkar
    const { password, role, isActive, ...safeData } = profileData;
    
    // Sadece güvenli alanları güncelle
    return await this.update(id, safeData);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    // Kullanıcıyı bul
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Aynı şifre kontrolü
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Yeni şifreyi hash'le ve güncelle
    const hashedNewPassword = await this.hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedNewPassword });
    
    logger.info('Password changed successfully', { userId: id });
  }

  async validateUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    return user ? user.isActive : false;
  }

  async deactivateUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    if (!user.isActive) {
      throw new ValidationError('User is already deactivated');
    }

    await this.userRepository.update(id, { isActive: false });
    logger.info('User deactivated', { userId: id });
    return true;
  }

  async activateUser(id: string): Promise<boolean> {
    // exists() kullanarak deactive user'ları da kontrol et
    const userExists = await this.userRepository.exists(id);
    if (!userExists) {
      throw new NotFoundError('User not found', { userId: id });
    }

    // Önce user'ı al (findById sadece active user'ları döner)
    // Bu yüzden findByEmail/Username pattern'i kullanarak bulalım
    const user = await this.userRepository.findAll({ 
      filters: { id },
      limit: 1 
    });

    if (user.data.length === 0) {
      throw new NotFoundError('User not found', { userId: id });
    }

    const userData = user.data[0];
    if (userData.isActive) {
      throw new ValidationError('User is already active');
    }

    await this.userRepository.update(id, { isActive: true });
    logger.info('User activated', { userId: id });
    return true;
  }

  async getUserStats(id: string): Promise<{
    totalPosts: number;
    totalComments: number;
    joinedDaysAgo: number;
    lastActivity: Date | null;
  }> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    const joinedDaysAgo = Math.floor(
      (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // UserResponseDto zaten postsCount ve commentsCount içeriyor
    const userDto = this.mapToResponseDto(user);

    return {
      totalPosts: userDto.postsCount || 0,
      totalComments: userDto.commentsCount || 0,
      joinedDaysAgo,
      lastActivity: user.updatedAt,
    };
  }

  async promoteToAuthor(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    if (user.role === UserRole.ADMIN) {
      throw new ValidationError('Admin users cannot be changed to author');
    }

    if (user.role === UserRole.AUTHOR) {
      throw new ValidationError('User is already an author');
    }

    const updatedUser = await this.userRepository.update(id, { role: UserRole.AUTHOR });
    logger.info('User promoted to author', { 
      userId: id, 
      username: user.username,
      fromRole: user.role,
      toRole: UserRole.AUTHOR
    });

    return this.mapToResponseDto(updatedUser);
  }

  async demoteToUser(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: id });
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenError('Admin users cannot be demoted');
    }

    if (user.role === UserRole.USER) {
      throw new ValidationError('User is already a regular user');
    }

    const updatedUser = await this.userRepository.update(id, { role: UserRole.USER });
    logger.info('User demoted to regular user', { 
      userId: id, 
      username: user.username,
      fromRole: user.role,
      toRole: UserRole.USER
    });

    return this.mapToResponseDto(updatedUser);
  }

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar ?? undefined, // null safety
      bio: user.bio ?? undefined, // null safety
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      postsCount: (user as any)._count?.blogPosts ?? 0,
      commentsCount: (user as any)._count?.comments ?? 0,
    };
  }
}