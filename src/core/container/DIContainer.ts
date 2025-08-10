// DI Container Configuration (core/container/DIContainer.ts)
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { TYPES } from './types';
import { DatabaseConfig } from '../../config/database';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { CategoryRepository } from '../../infrastructure/database/repositories/CategoryRepository';
import { BlogPostRepository } from '../../infrastructure/database/repositories/BlogPostRepository';
import { CommentRepository } from '../../infrastructure/database/repositories/CommentRepository';
import { UserController } from '../../presentation/controllers/UserController';
import { CommentController } from '../../presentation/controllers/CommentController';
import { UnitOfWork } from '../../infrastructure/UnitOfWork';
import { IUserRepository } from '../interfaces/Repositories/IUserRepository ';
import { ICategoryRepository } from '../interfaces/Repositories/ICategoryRepository';
import { IBlogPostRepository } from '../interfaces/Repositories/IBlogPostRepository';
import { ICommentRepository } from '../interfaces/Repositories/ICommentRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';
import { IUserService } from '../interfaces/Services/IUserService';
import { ICategoryService } from '../interfaces/Services/ICategoryService';
import { UserService } from '../../application/services/UserService';
import { CategoryService } from '../../application/services/CategoryService';
import { IBlogPostService } from '../interfaces/Services/IBlogPostService';
import { BlogPostService } from '../../application/services/BlogPostService';
import { ICommentService } from '../interfaces/Services/ICommentService';
import { CommentService } from '../../application/services/CommentService';
import { IAuthService } from '../interfaces/Services/IAuthService';
import { AuthService } from '../../application/services/AuthService';
import { IImageService } from '../interfaces/Services/IImageService';
import { ImageService } from '../../application/services/ImageService';
import { CategoryController } from '../../presentation/controllers/CategoryController';
import { BlogPostController } from '../../presentation/controllers/BlogPostController';

export class DIContainer {
  private static container: Container;

  public static getContainer(): Container {
    if (!DIContainer.container) {
      DIContainer.container = new Container({
        defaultScope: 'Singleton',
        skipBaseClassChecks: true,
      });
      DIContainer.configureContainer();
    }
    return DIContainer.container;
  }

  private static configureContainer(): void {
    const container = DIContainer.container;

    // ===============================
    // Database Layer
    // ===============================
    container.bind<PrismaClient>(TYPES.PrismaClient)
      .toConstantValue(DatabaseConfig.getInstance().getClient());

    // ===============================
    // Repository Layer
    // ===============================
    container.bind<IUserRepository>(TYPES.IUserRepository)
      .to(UserRepository)
      .inSingletonScope();
    
    container.bind<ICategoryRepository>(TYPES.ICategoryRepository)
      .to(CategoryRepository)
      .inSingletonScope();
    
    container.bind<IBlogPostRepository>(TYPES.IBlogPostRepository)
      .to(BlogPostRepository)
      .inSingletonScope();
    
    container.bind<ICommentRepository>(TYPES.ICommentRepository)
      .to(CommentRepository)
      .inSingletonScope();

    // ===============================
    // Unit of Work
    // ===============================
    container.bind<IUnitOfWork>(TYPES.IUnitOfWork)
      .to(UnitOfWork)
      .inSingletonScope();

    // ===============================
    // Service Layer
    // ===============================
    container.bind<IUserService>(TYPES.IUserService)
      .to(UserService)
      .inSingletonScope();
    
    container.bind<ICategoryService>(TYPES.ICategoryService)
      .to(CategoryService)
      .inSingletonScope();
    
    container.bind<IBlogPostService>(TYPES.IBlogPostService)
      .to(BlogPostService)
      .inSingletonScope();
    
    container.bind<ICommentService>(TYPES.ICommentService)
      .to(CommentService)
      .inSingletonScope();

    container.bind<IAuthService>(TYPES.IAuthService)
      .to(AuthService)
      .inSingletonScope();

    container.bind<IImageService>(TYPES.IImageService)
      .to(ImageService)
      .inSingletonScope();

    // ===============================
    // Controller Layer
    // ===============================
    container.bind<UserController>(TYPES.UserController)
      .to(UserController)
      .inTransientScope(); // Controllers should be transient

    container.bind<CategoryController>(TYPES.CategoryController)
      .to(CategoryController)
      .inTransientScope();
    
    container.bind<BlogPostController>(TYPES.BlogPostController)
      .to(BlogPostController)
      .inTransientScope();
    
    container.bind<CommentController>(TYPES.CommentController)
      .to(CommentController)
      .inTransientScope();
  }

  /**
   * Get a service instance by type
   */
  public static get<T>(serviceIdentifier: symbol): T {
    return DIContainer.getContainer().get<T>(serviceIdentifier);
  }

  /**
   * Check if a service is bound
   */
  public static isBound(serviceIdentifier: symbol): boolean {
    return DIContainer.getContainer().isBound(serviceIdentifier);
  }

  /**
   * Unbind a service (useful for testing)
   */
  public static unbind(serviceIdentifier: symbol): void {
    if (DIContainer.container) {
      DIContainer.container.unbind(serviceIdentifier);
    }
  }

  /**
   * Reset container (useful for testing)
   */
  public static reset(): void {
    if (DIContainer.container) {
      DIContainer.container.unbindAll();
      DIContainer.configureContainer();
    }
  }

  /**
   * Create a child container (useful for request scoping)
   */
  public static createChildContainer(): Container {
    return DIContainer.getContainer().createChild();
  }
}