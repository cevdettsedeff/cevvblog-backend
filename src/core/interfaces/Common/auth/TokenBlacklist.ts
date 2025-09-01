import { User } from "@prisma/client";

export interface TokenBlacklist {
  id: string;
  token: string;
  userId?: string;
  user?: User;
  createdAt: Date;
  expiresAt: Date;
}