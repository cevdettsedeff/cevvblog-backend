import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TYPES } from "../../core/container/types";
import { requireRole } from "../../core/middleware/auth";
import { CategoryRoutesSchema } from "../../schemas/routes/categoryRoutesSchema";
import { validateBody } from "../../core/middleware/validation";
import { categorySchemas } from "../../application/validators/schemas";
import { DIContainer } from "../../core/container/DIContainer";
import { CategoryController } from "../controllers/CategoryController";

export async function registerCategoryRoutes(fastify: FastifyInstance) {
  const categoryController = DIContainer.get(TYPES.CategoryController) as CategoryController;

  // Public routes
  fastify.get('/', {
    schema: CategoryRoutesSchema.GetAllCategories.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getAllCategories(request, reply);
    }
  });

  fastify.get('/active', {
    schema: CategoryRoutesSchema.GetActiveCategories.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getActiveCategories(request, reply);
    }
  });

  fastify.get('/:id', {
    schema: CategoryRoutesSchema.GetCategoryById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryById(request, reply);
    }
  });

  fastify.get('/slug/:slug', {
    schema: CategoryRoutesSchema.GetCategoryBySlug.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryBySlug(request, reply);
    }
  });

  // Get posts by category
  fastify.get('/:id/posts', {
    schema: CategoryRoutesSchema.GetCategoryPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryPosts(request, reply);
    }
  });

  // Admin only routes
  fastify.post('/', {
    schema: CategoryRoutesSchema.CreateCategory.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN']),
      validateBody(categorySchemas.create)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.createCategory(request, reply);
    }
  });

  fastify.put('/:id', {
    schema: CategoryRoutesSchema.UpdateCategory.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN']),
      validateBody(categorySchemas.update)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.updateCategory(request, reply);
    }
  });

  fastify.delete('/:id', {
    schema: CategoryRoutesSchema.DeleteCategory.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.deleteCategory(request, reply);
    }
  });

  fastify.put('/:id/sort-order', {
    schema: CategoryRoutesSchema.UpdateSortOrder.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN']),
      validateBody(categorySchemas.sortOrder)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.updateSortOrder(request, reply);
    }
  });

  // ✅ Bulk sort order update - Controller'a taşındı
  fastify.put('/bulk-sort-order', {
    schema: CategoryRoutesSchema.BulkUpdateSortOrder.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN']),
      validateBody(categorySchemas.bulkSortOrder) // Bu schema'yı da eklemelisin
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.bulkUpdateSortOrder(request, reply);
    }
  });

  // ✅ Category stats - Controller'a taşındı  
  fastify.get('/admin/stats', {
    schema: CategoryRoutesSchema.GetCategoryStats.schema,
    preHandler: [
      fastify.authenticate,
      requireRole(['ADMIN'])
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryStats(request, reply);
    }
  });
}