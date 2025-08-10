import { User } from "../../../domain/entities/User";
import { IRepository } from "../IRepository";

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAuthors(): Promise<User[]>;
  updateLastLogin(id: string): Promise<void>;
  findActiveUsers(): Promise<User[]>;
}