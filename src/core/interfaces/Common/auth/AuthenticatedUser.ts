import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}