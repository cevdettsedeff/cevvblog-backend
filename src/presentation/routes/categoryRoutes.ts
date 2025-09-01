import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TYPES } from "../../core/container/types";
import { 
  authenticate, 
  adminOnly 
} from "../../core/middleware/auth";
import { CategoryRoutesSchema } from "../../schemas/routes/categoryRoutesSchema";
import { validateBody } from "../../core/middleware/validation";
import { categorySchemas } from "../../application/validators/schemas";
import { CategoryController } from "../controllers/CategoryController";
import { DIContainer } from "../../core/container/DIContainer";

export async function registerCategoryRoutes(fastify: FastifyInstance) {
  const categoryController = DIContainer.get<CategoryController>(TYPES.CategoryController);

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
      authenticate,
      adminOnly,
      validateBody(categorySchemas.create)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.createCategory(request, reply);
    }
  });

  fastify.put('/:id', {
    schema: CategoryRoutesSchema.UpdateCategory.schema,
    preHandler: [
      authenticate,
      adminOnly,
      validateBody(categorySchemas.update)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.updateCategory(request, reply);
    }
  });

  fastify.delete('/:id', {
    schema: CategoryRoutesSchema.DeleteCategory.schema,
    preHandler: [
      authenticate,
      adminOnly
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.deleteCategory(request, reply);
    }
  });

  fastify.put('/:id/sort-order', {
    schema: CategoryRoutesSchema.UpdateSortOrder.schema,
    preHandler: [
      authenticate,
      adminOnly,
      validateBody(categorySchemas.sortOrder)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.updateSortOrder(request, reply);
    }
  });

  // Bulk sort order update
  fastify.put('/bulk-sort-order', {
    schema: CategoryRoutesSchema.BulkUpdateSortOrder.schema,
    preHandler: [
      authenticate,
      adminOnly,
      validateBody(categorySchemas.bulkSortOrder)
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.bulkUpdateSortOrder(request, reply);
    }
  });

  // Category stats  
  fastify.get('/admin/stats', {
    schema: CategoryRoutesSchema.GetCategoryStats.schema,
    preHandler: [
      authenticate,
      adminOnly
    ],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryStats(request, reply);
    }
  });
}