import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/UserController';
import { 
  authenticate, 
  adminOnly, 
  requireOwnership 
} from '../../core/middleware/auth';
import { validateBody } from '../../core/middleware/validation';
import { authSchemas, userSchemas } from '../../application/validators/schemas';
import { UserRoutesSchema } from '../../schemas/routes/userRoutesSchema';
import { TYPES } from '../../core/container/types';
import { DIContainer } from '../../core/container/DIContainer';

export async function registerUserRoutes(fastify: FastifyInstance) {
  const userController = DIContainer.get<UserController>(TYPES.UserController);

  // ===== PUBLIC ROUTES =====
  
  // POST /register
  fastify.post('/register', {
    schema: UserRoutesSchema.Register.schema,
    preHandler: [validateBody(authSchemas.register)],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.register(request, reply);
    }
  });

  // POST /login
  fastify.post('/login', {
    schema: UserRoutesSchema.Login.schema,
    preHandler: [validateBody(authSchemas.login)],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.login(request, reply);
    }
  });

  // POST /refresh
  fastify.post('/refresh', {
    schema: UserRoutesSchema.RefreshToken.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.refreshToken(request, reply);
    }
  });

  // GET /authors - Public endpoint
  fastify.get('/authors', {
    schema: UserRoutesSchema.GetAuthors.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getAuthors(request, reply);
    }
  });

  // GET /:id - Public user profile
  fastify.get('/:id', {
    schema: UserRoutesSchema.GetUserById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getUserById(request, reply);
    }
  });

  // ===== AUTHENTICATED ROUTES =====
  
  // POST /logout
  fastify.post('/logout', {
    schema: UserRoutesSchema.Logout.schema,
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.logout(request, reply);
    }
  });

  // GET /profile - Get current user profile
  fastify.get('/profile', {
    schema: UserRoutesSchema.GetProfile.schema,
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getProfile(request, reply);
    }
  });

  // PUT /profile - Update current user profile
  fastify.put('/profile', {
    schema: UserRoutesSchema.UpdateProfile.schema,
    preHandler: [
      authenticate,
      validateBody(userSchemas.updateProfile)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.updateProfile(request, reply);
    }
  });

  // POST /change-password
  fastify.post('/change-password', {
    schema: UserRoutesSchema.ChangePassword.schema,
    preHandler: [authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.changePassword(request, reply);
    }
  });

  // GET /:id/stats - User stats (own or admin)
  fastify.get('/:id/stats', {
    schema: UserRoutesSchema.GetUserStats.schema,
    preHandler: [authenticate, requireOwnership()],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getUserStats(request, reply);
    }
  });

  // ===== ADMIN ROUTES =====
  
  // GET / - Get all users (Admin only)
  fastify.get('/', {
    schema: UserRoutesSchema.GetAllUsers.schema,
    preHandler: [authenticate, adminOnly],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getAllUsers(request, reply);
    }
  });

  // POST /:id/promote - Promote user to author (Admin only)
  fastify.post('/:id/promote', {
    schema: UserRoutesSchema.PromoteToAuthor.schema,
    preHandler: [authenticate, adminOnly],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.promoteToAuthor(request, reply);
    }
  });

  // POST /:id/demote - Demote author to user (Admin only)
  fastify.post('/:id/demote', {
    schema: UserRoutesSchema.DemoteToUser.schema,
    preHandler: [authenticate, adminOnly],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.demoteToUser(request, reply);
    }
  });

  // POST /:id/deactivate - Deactivate user (Admin only)
  fastify.post('/:id/deactivate', {
    schema: UserRoutesSchema.DeactivateUser.schema,
    preHandler: [authenticate, adminOnly],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.deactivateUser(request, reply);
    }
  });

  // POST /:id/activate - Activate user (Admin only)
  fastify.post('/:id/activate', {
    schema: UserRoutesSchema.ActivateUser.schema,
    preHandler: [authenticate, adminOnly],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.activateUser(request, reply);
    }
  });
}