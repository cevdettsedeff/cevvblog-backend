# Blog API

Modern blog backend API built with Clean Architecture principles using Fastify, TypeScript, and dependency injection.

## 🚀 Features

- **Clean Architecture** - Separation of concerns with well-defined layers
- **TypeScript** - Full type safety and modern JavaScript features
- **Fastify** - High-performance web framework
- **Dependency Injection** - Loosely coupled components using IoC container
- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - User, Author, and Admin roles
- **File Upload** - Image upload functionality for blog posts
- **API Documentation** - Auto-generated Swagger/OpenAPI documentation
- **Request Validation** - Schema validation using JSON Schema
- **Comprehensive Logging** - Winston logger with different log levels
- **Error Handling** - Centralized error handling middleware
- **CORS Configuration** - Secure cross-origin resource sharing
- **Database Integration** - Modern database connection with pooling
- **Graceful Shutdown** - Proper cleanup on application termination

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Database (PostgreSQL/MySQL/MongoDB - based on your configuration)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database
   DATABASE_URL=your_database_connection_string
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   CORS_CREDENTIALS=true
   ```

4. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Other Scripts
```bash
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run type-check    # TypeScript type checking
```

## 📚 API Documentation

Once the server is running, you can access:

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs/json`
- **Health Check**: `http://localhost:3000/health`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **USER** - Basic user privileges
- **AUTHOR** - Can create and manage blog posts
- **ADMIN** - Full system access

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (authenticated)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Owner/Admin)
- `DELETE /api/users/:id` - Delete user (Owner/Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Blog Posts
- `GET /api/posts` - Get all published posts
- `GET /api/posts/popular` - Get popular posts
- `GET /api/posts/recent` - Get recent posts
- `GET /api/posts/search` - Search posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/slug/:slug` - Get post by slug
- `GET /api/posts/category/:categorySlug` - Get posts by category
- `GET /api/posts/author/:authorId` - Get posts by author
- `POST /api/posts` - Create post (Author/Admin)
- `PUT /api/posts/:id` - Update post (Owner/Admin)
- `DELETE /api/posts/:id` - Delete post (Owner/Admin)
- `POST /api/posts/:id/upload-image` - Upload single image (Owner/Admin)
- `POST /api/posts/:id/upload-images` - Upload multiple images (Owner/Admin)

### Comments
- `GET /api/comments` - Get all comments
- `POST /api/comments` - Create comment (authenticated)
- `PUT /api/comments/:id` - Update comment (Owner/Admin)
- `DELETE /api/comments/:id` - Delete comment (Owner/Admin)

## 🏗️ Project Structure

```
src/
├── application/          # Application layer (use cases, services)
│   ├── services/        # Business logic services
│   ├── validators/      # Input validation schemas
│   └── interfaces/      # Application interfaces
├── core/                # Core layer (frameworks, external concerns)
│   ├── container/       # Dependency injection container
│   ├── interfaces/      # Core interfaces
│   └── middleware/      # Express/Fastify middleware
├── domain/              # Domain layer (entities, business rules)
│   ├── entities/        # Domain entities
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain services
├── infrastructure/      # Infrastructure layer (database, external APIs)
│   ├── database/        # Database implementation
│   ├── repositories/    # Repository implementations
│   └── services/        # External service implementations
├── presentation/        # Presentation layer (controllers, routes)
│   ├── controllers/     # HTTP controllers
│   ├── routes/          # Route definitions
│   └── middleware/      # Presentation middleware
├── schemas/             # JSON schemas for validation
│   ├── routes/          # Route-specific schemas
│   └── common/          # Common response schemas
├── config/              # Configuration files
│   ├── database.ts      # Database configuration
│   └── env.ts           # Environment configuration
└── utils/               # Utility functions
    ├── logger.ts        # Winston logger configuration
    └── helpers.ts       # Helper functions
```

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
└── fixtures/          # Test data and fixtures
```

## 🐳 Docker Support

### Development with Docker
```bash
docker-compose up -dev
```

### Production with Docker
```bash
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Database connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `CORS_CREDENTIALS` | Allow credentials in CORS | `true` |

### File Upload Configuration
- **Max file size**: 5MB per file
- **Max files**: 5 files per request
- **Allowed formats**: JPG, PNG, GIF, WebP

## 📊 Monitoring & Logging

### Log Levels
- **error** - Error conditions
- **warn** - Warning conditions
- **info** - General information
- **debug** - Debug information
- **database** - Database operations
- **security** - Security-related events
- **performance** - Performance monitoring
- **request** - HTTP request logging

### Log Files
```
logs/
├── app.log           # General application logs
├── error.log         # Error logs only
├── database.log      # Database operation logs
└── security.log      # Security event logs
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set strong JWT secret
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Environment Setup
```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow Clean Architecture principles
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](http://localhost:3000/docs)
2. Search existing [issues](issues-url)
3. Create a new [issue](issues-url) if needed

## 🙏 Acknowledgments

- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [Swagger](https://swagger.io/) - API documentation

---

Made with ❤️ by [Cevdet Sedef]