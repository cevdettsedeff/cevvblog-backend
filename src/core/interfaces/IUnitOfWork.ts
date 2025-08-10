import { IBlogPostRepository } from "./Repositories/IBlogPostRepository";
import { ICategoryRepository } from "./Repositories/ICategoryRepository";
import { ICommentRepository } from "./Repositories/ICommentRepository";
import { IUserRepository } from "./Repositories/IUserRepository ";

export interface IUnitOfWork {
  users: IUserRepository;
  categories: ICategoryRepository;
  blogPosts: IBlogPostRepository;
  comments: ICommentRepository;
  
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  dispose(): Promise<void>;
}