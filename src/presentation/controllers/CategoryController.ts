import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../utils/logger";
import { UpdateCategoryDto } from "../../application/dtos/category/UpdateCategoryDto";
import { CreateCategoryDto } from "../../application/dtos/category/CreateCategoryDto";
import { ICategoryService } from "../../core/interfaces/Services/ICategoryService";
import { TYPES } from "../../core/container/types";
import { inject, injectable } from "inversify";
import { IBlogPostService } from "../../core/interfaces/Services/IBlogPostService";

@injectable()
export class CategoryController {
  constructor(
    @inject(TYPES.ICategoryService) private categoryService: ICategoryService,
    @inject(TYPES.IBlogPostService) private blogPostService: IBlogPostService
  ) {}

  // GET /api/categories
  async getAllCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 50,
        sortBy: query.sortBy || 'sortOrder',
        sortOrder: query.sortOrder || 'asc',
        filters: query.filters ? JSON.parse(query.filters) : {},
      };

      const result = await this.categoryService.getAll(options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get categories error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch categories',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/active (For navbar)
  async getActiveCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await this.categoryService.getActive();
      
      return reply.send({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Get active categories error:', {
        error: error.message,
        stack: error.stack,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch active categories',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/:id
  async getCategoryById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const category = await this.categoryService.getById(id);
      
      if (!category) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Get category error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch category',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/:id/posts
  async getCategoryPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as any;
      
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }

      // First check if category exists
      const category = await this.categoryService.getById(id);
      if (!category) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
        sortBy: query.sortBy || 'publishedAt',
        sortOrder: query.sortOrder || 'desc',
      };

      // Use category slug for blog post service
      const result = await this.blogPostService.getByCategory(category.slug, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        }
      });
    } catch (error: any) {
      logger.error('Get category posts error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        query: request.query,
        ip: request.ip
      });
      
      if (error.name === 'NotFoundError') {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch category posts',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/slug/:slug
  async getCategoryBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const category = await this.categoryService.getBySlug(slug);
      
      if (!category) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: category,
      });
    } catch (error: any) {
      logger.error('Get category by slug error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch category',
        statusCode: 500
      });
    }
  }

  // POST /api/categories (Auth required - ADMIN)
  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categoryData = request.body as CreateCategoryDto;
      
      // Check if category with same name exists
      const existingCategories = await this.categoryService.getAll({
        filters: { name: { equals: categoryData.name, mode: 'insensitive' } }
      });
      
      if (existingCategories.data.length > 0) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Category with this name already exists',
          statusCode: 400
        });
      }

      const category = await this.categoryService.create(categoryData);
      
      logger.info('Category created', {
        categoryId: category.id,
        categoryName: category.name,
        adminId: request.user!.id,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error: any) {
      logger.error('Create category error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create category',
        statusCode: 500
      });
    }
  }

  // PUT /api/categories/:id (Auth required - ADMIN)
  async updateCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateCategoryDto;

      // Check if category exists
      const existingCategory = await this.categoryService.getById(id);
      if (!existingCategory) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      // Check if new name conflicts with existing category
      if (updateData.name && updateData.name !== existingCategory.name) {
        const conflictingCategories = await this.categoryService.getAll({
          filters: { 
            name: { equals: updateData.name, mode: 'insensitive' },
            id: { not: id }
          }
        });
        
        if (conflictingCategories.data.length > 0) {
          return reply.status(400).send({ 
            error: 'Validation Error',
            message: 'Category with this name already exists',
            statusCode: 400
          });
        }
      }

      const category = await this.categoryService.update(id, updateData);
      
      logger.info('Category updated', {
        categoryId: id,
        categoryName: category.name,
        updatedFields: Object.keys(updateData),
        adminId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error: any) {
      logger.error('Update category error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update category',
        statusCode: 500
      });
    }
  }

  // DELETE /api/categories/:id (Auth required - ADMIN)
  async deleteCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const exists = await this.categoryService.getById(id);
      if (!exists) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      const success = await this.categoryService.delete(id);
      if (!success) {
        return reply.status(500).send({ 
          error: 'Internal Server Error',
          message: 'Failed to delete category',
          statusCode: 500
        });
      }

      logger.info('Category deleted', {
        categoryId: id,
        categoryName: exists.name,
        adminId: request.user!.id,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete category error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete category',
        statusCode: 500
      });
    }
  }

  // PUT /api/categories/:id/sort-order (Auth required - ADMIN)
  async updateSortOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { sortOrder } = request.body as { sortOrder: number };

      // Check if category exists
      const exists = await this.categoryService.getById(id);
      if (!exists) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      await this.categoryService.updateSortOrder(id, sortOrder);
      
      logger.info('Category sort order updated', {
        categoryId: id,
        categoryName: exists.name,
        newSortOrder: sortOrder,
        adminId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Sort order updated successfully',
      });
    } catch (error: any) {
      logger.error('Update sort order error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update sort order',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/admin/stats
async getCategoryStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await this.categoryService.getCategoryStats();
    
    logger.info('Admin fetched category stats', {
      adminId: request.user!.id,
      categoriesCount: stats.length,
      ip: request.ip
    });
    
    return reply.send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to get Category stats',
        statusCode: 500
      });
  }
}

// PUT /api/categories/bulk-sort-order
  async bulkUpdateSortOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categories } = request.body as { categories: Array<{ id: string; sortOrder: number }> };

      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Categories array is required and cannot be empty',
          statusCode: 400
        });
      }

      if (categories.length > 50) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Cannot update more than 50 categories at once',
          statusCode: 400
        });
      }

      // Validate each category
      for (const cat of categories) {
        if (!cat.id || typeof cat.sortOrder !== 'number' || cat.sortOrder < 0) {
          return reply.status(400).send({ 
            success: false,
            error: 'Validation Error',
            message: 'Each category must have valid id and non-negative sortOrder',
            statusCode: 400
          });
        }
      }

      // Verify all categories exist
      for (const cat of categories) {
        const exists = await this.categoryService.getById(cat.id);
        if (!exists) {
          return reply.status(404).send({ 
            success: false,
            error: 'Not Found',
            message: `Category with ID ${cat.id} not found`,
            statusCode: 404
          });
        }
      }

      // Update all sort orders
      await Promise.all(
        categories.map(cat => this.categoryService.updateSortOrder(cat.id, cat.sortOrder))
      );
      
      logger.info('Bulk category sort order updated', {
        categoriesCount: categories.length,
        categoryIds: categories.map(c => c.id),
        adminId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: `${categories.length} categories sort order updated successfully`,
      });
    } catch (error: any) {
      logger.error('Bulk update sort order error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to bulk update sort order',
        statusCode: 500
      });
    }
  }
}