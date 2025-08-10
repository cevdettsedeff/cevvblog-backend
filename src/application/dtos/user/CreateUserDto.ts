import { UserRole } from "../../../domain/enums/UserRole";

export interface CreateUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  bio?: string;
  avatar?: string;
  role?: UserRole; // Use enum instead of string literals
}