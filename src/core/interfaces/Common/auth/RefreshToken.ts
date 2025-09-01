import { User } from "@prisma/client";

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  user?: User;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}