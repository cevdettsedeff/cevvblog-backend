import { UserRole } from "@prisma/client"; // Prisma enum'ını kullan

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  postsCount?: number;
  commentsCount?: number;
}