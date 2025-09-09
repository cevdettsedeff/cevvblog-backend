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
  
  // GET /api/categories - Get all categories with pagination
  fastify.get('/', {
    schema: CategoryRoutesSchema.GetAllCategories.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getAllCategories(request, reply);
    }
  });

  // GET /api/categories/active - Get active categories (for navbar)
  fastify.get('/active', {
    schema: CategoryRoutesSchema.GetActiveCategories.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getActiveCategories(request, reply);
    }
  });

  // GET /api/categories/popular - Get popular categories by post count
  fastify.get('/popular', {
    schema: CategoryRoutesSchema.GetPopularCategories.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getPopularCategories(request, reply);
    }
  });

  // GET /api/categories/count - Get categories count statistics
  fastify.get('/count', {
    schema: CategoryRoutesSchema.GetCategoriesCount.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoriesCount(request, reply);
    }
  });

  // GET /api/categories/:id - Get category by ID
  fastify.get('/:id', {
    schema: CategoryRoutesSchema.GetCategoryById.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryById(request, reply);
    }
  });

  // GET /api/categories/slug/:slug - Get category by slug
  fastify.get('/slug/:slug', {
    schema: CategoryRoutesSchema.GetCategoryBySlug.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryBySlug(request, reply);
    }
  });

  // GET /api/categories/:id/posts - Get posts by category
  fastify.get('/:id/posts', {
    schema: CategoryRoutesSchema.GetCategoryPosts.schema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return categoryController.getCategoryPosts(request, reply);
    }
  });

  // Admin only routes
  
  // POST /api/categories - Create new category (Admin only)
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

  // PUT /api/categories/:id - Update category (Admin only)
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

  // DELETE /api/categories/:id - Delete category (Admin only)
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

  // PUT /api/categories/:id/sort-order - Update category sort order (Admin only)
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

  // PUT /api/categories/bulk-sort-order - Bulk update sort orders (Admin only)
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

  // GET /api/categories/admin/stats - Get category statistics (Admin only)
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