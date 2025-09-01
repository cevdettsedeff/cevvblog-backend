import { UserRole } from "@prisma/client";

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}