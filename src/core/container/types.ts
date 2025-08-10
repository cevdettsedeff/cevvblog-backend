export const TYPES = {
  // Database
  PrismaClient: Symbol.for('PrismaClient'),
  
  // Unit of Work
  IUnitOfWork: Symbol.for('IUnitOfWork'),
  
  // Repositories
  IUserRepository: Symbol.for('IUserRepository'),
  ICategoryRepository: Symbol.for('ICategoryRepository'),
  IBlogPostRepository: Symbol.for('IBlogPostRepository'),
  ICommentRepository: Symbol.for('ICommentRepository'),
  
  // Services
  IUserService: Symbol.for('IUserService'),
  ICategoryService: Symbol.for('ICategoryService'),
  IBlogPostService: Symbol.for('IBlogPostService'),
  ICommentService: Symbol.for('ICommentService'),
  IAuthService: Symbol.for('IAuthService'),
  IImageService: Symbol.for('IImageService'),
  
  // Controllers
  UserController: Symbol.for('UserController'),
  CategoryController: Symbol.for('CategoryController'),
  BlogPostController: Symbol.for('BlogPostController'),
  CommentController: Symbol.for('CommentController'),
};