import { UserRole } from "@prisma/client"; // Prisma enum'ını kullan

export interface UpdateUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  bio?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
}