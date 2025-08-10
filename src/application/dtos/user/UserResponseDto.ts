import { UserRole } from "../../../domain/enums/UserRole";

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: UserRole; // Use enum for consistency
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  postsCount?: number;
  commentsCount?: number;
}