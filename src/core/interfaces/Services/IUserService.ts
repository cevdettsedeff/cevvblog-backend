import { CreateUserDto } from "../../../application/dtos/user/CreateUserDto";
import { UpdateUserDto } from "../../../application/dtos/user/UpdateUserDto";
import { UserResponseDto } from "../../../application/dtos/user/UserResponseDto";
import { IService } from "../IService";

export interface IUserService extends IService<UserResponseDto, CreateUserDto, UpdateUserDto> {
  // Basic user operations
  getByEmail(email: string): Promise<UserResponseDto | null>;
  getByUsername(username: string): Promise<UserResponseDto | null>;
  getAuthors(): Promise<UserResponseDto[]>;
  getActiveUsers(): Promise<UserResponseDto[]>;

  // Profile management
  getProfile(id: string): Promise<UserResponseDto>;
  updateProfile(id: string, profileData: UpdateUserDto): Promise<UserResponseDto>;

  // Security operations
  changePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
  validateUser(id: string): Promise<boolean>;
  deactivateUser(id: string): Promise<boolean>;
  activateUser(id: string): Promise<boolean>;

  // User statistics
  getUserStats(id: string): Promise<{
    totalPosts: number;
    totalComments: number;
    joinedDaysAgo: number;
    lastActivity: Date | null;
  }>;

  // Admin operations
  promoteToAuthor(id: string): Promise<UserResponseDto>;
  demoteToUser(id: string): Promise<UserResponseDto>;
}