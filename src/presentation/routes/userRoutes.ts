// 8. Updated User Routes with Schema (presentation/routes/userRoutes.ts)
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/UserController';
import { requireRole } from '../../core/middleware/auth';
import { validateBody } from '../../core/middleware/validation';
import { authSchemas, userSchemas } from '../../application/validators/schemas';
import { UserRoutesSchema } from '../../schemas/routes/userRoutesSchema';
import { TYPES } from '../../core/container/types';
import { DIContainer } from '../../core/container/DIContainer';

export async function registerUserRoutes(fastify: FastifyInstance) {
  const userController = DIContainer.get(TYPES.UserController) as UserController;

  // Public routes
  fastify.post('/register', {
    schema: UserRoutesSchema.Register.schema,
    preHandler: [validateBody(authSchemas.register)],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.register(request, reply);
    }
  });

fastify.post('/login', {
  ...UserRoutesSchema.Login, // ✅ Tüm özellikleri al (tags, summary, description, schema)
  preHandler: [validateBody(authSchemas.login)],
  handler: async (request: FastifyRequest, reply: FastifyReply) => {
    return userController.login(request, reply);
  }
});

  fastify.get('/authors', {
    schema: UserRoutesSchema.GetAuthors.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getAuthors(request, reply);
    }
  });

  fastify.get('/:id', {
    schema: UserRoutesSchema.GetUserById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getUserById(request, reply);
    }
  });

  // Protected routes
  fastify.get('/profile', {
    schema: UserRoutesSchema.GetProfile.schema,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getProfile(request, reply);
    }
  });

  fastify.put('/profile', {
    schema: UserRoutesSchema.UpdateProfile.schema,
    preHandler: [
      fastify.authenticate,
      validateBody(userSchemas.updateProfile)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.updateProfile(request, reply);
    }
  });

  // Admin routes
  fastify.get('/', {
    schema: UserRoutesSchema.GetAllUsers.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return userController.getAllUsers(request, reply);
    }
  });
}