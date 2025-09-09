// src/presentation/controllers/CategoryController.ts

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
      
      // Input validation ve sanitization
      const options = {
        page: Math.max(1, parseInt(query.page) || 1),
        limit: Math.min(Math.max(1, parseInt(query.limit) || 50), 100),
        sortBy: query.sortBy || 'sortOrder',
        sortOrder: (query.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
        filters: query.filters ? this.safeParseJSON(query.filters) : {},
      };

      logger.info('Fetching all categories', {
        options,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });

      const result = await this.categoryService.getAll(options);
      
      logger.info('Categories fetched successfully', {
        count: result.data.length,
        totalItems: result.pagination.totalItems,
        currentPage: result.pagination.currentPage,
        ip: request.ip
      });
      
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
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch categories',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/active (For navbar and frontend)
  async getActiveCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Fetching active categories', {
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });

      const categories = await this.categoryService.getActive();
      
      logger.info('Active categories fetched successfully', {
        count: categories.length,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: categories,
        meta: {
          count: categories.length,
          fetchedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Get active categories error:', {
        error: error.message,
        stack: error.stack,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        success: false,
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
      
      // Input validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }
      
      logger.info('Fetching category by ID', {
        categoryId: id,
        ip: request.ip
      });

      const category = await this.categoryService.getById(id);
      
      if (!category) {
        logger.warn('Category not found', {
          categoryId: id,
          ip: request.ip
        });
        
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      logger.info('Category fetched successfully', {
        categoryId: id,
        categoryName: category.name,
        ip: request.ip
      });

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
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch category',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/slug/:slug
  async getCategoryBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      
      // Input validation
      if (!slug || slug.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category slug is required',
          statusCode: 400
        });
      }
      
      logger.info('Fetching category by slug', {
        slug,
        ip: request.ip
      });

      const category = await this.categoryService.getBySlug(slug);
      
      if (!category) {
        logger.warn('Category not found by slug', {
          slug,
          ip: request.ip
        });
        
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      logger.info('Category fetched by slug successfully', {
        slug,
        categoryId: category.id,
        categoryName: category.name,
        ip: request.ip
      });

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
        success: false,
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
      
      // Input validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }

      // Check if category exists first
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
        page: Math.max(1, parseInt(query.page) || 1),
        limit: Math.min(Math.max(1, parseInt(query.limit) || 10), 50),
        sortBy: query.sortBy || 'publishedAt',
        sortOrder: (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
      };

      logger.info('Fetching category posts', {
        categoryId: id,
        categorySlug: category.slug,
        options,
        ip: request.ip
      });

      // Use category slug for blog post service
      const result = await this.blogPostService.getByCategory(category.slug, options);
      
      logger.info('Category posts fetched successfully', {
        categoryId: id,
        postsCount: result.data.length,
        totalItems: result.pagination.totalItems,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color,
          icon: category.icon
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

  // POST /api/categories (Auth required - ADMIN)
  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categoryData = request.body as CreateCategoryDto;
      
      // Input validation
      if (!categoryData.name || categoryData.name.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category name is required',
          statusCode: 400
        });
      }
      
      logger.info('Creating new category', {
        categoryName: categoryData.name,
        adminId: request.user!.id,
        ip: request.ip
      });
      
      const category = await this.categoryService.create(categoryData);
      
      logger.info('Category created successfully', {
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: category.slug,
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
      
      // Handle specific validation errors
      if (error.message.includes('already exists')) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      if (error.message.includes('required') || error.message.includes('invalid')) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
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

      // Input validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }

      logger.info('Updating category', {
        categoryId: id,
        updateFields: Object.keys(updateData),
        adminId: request.user!.id,
        ip: request.ip
      });

      const category = await this.categoryService.update(id, updateData);
      
      logger.info('Category updated successfully', {
        categoryId: id,
        categoryName: category.name,
        categorySlug: category.slug,
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
      
      // Handle specific validation errors
      if (error.message.includes('not found')) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: error.message,
          statusCode: 404
        });
      }
      
      if (error.message.includes('already exists')) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      if (error.message.includes('invalid')) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        success: false,
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

      // Input validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }

      logger.info('Deleting category', {
        categoryId: id,
        adminId: request.user!.id,
        ip: request.ip
      });

      // Check if category exists
      const existingCategory = await this.categoryService.getById(id);
      if (!existingCategory) {
        return reply.status(404).send({ 
          success: false,
          error: 'Not Found',
          message: 'Category not found',
          statusCode: 404
        });
      }

      const success = await this.categoryService.delete(id);
      if (!success) {
        return reply.status(500).send({ 
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to delete category',
          statusCode: 500
        });
      }

      logger.info('Category deleted successfully', {
        categoryId: id,
        categoryName: existingCategory.name,
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
        success: false,
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

      // Input validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Category ID is required',
          statusCode: 400
        });
      }

      if (typeof sortOrder !== 'number' || sortOrder < 0) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: 'Valid sort order is required (non-negative number)',
          statusCode: 400
        });
      }

      logger.info('Updating category sort order', {
        categoryId: id,
        newSortOrder: sortOrder,
        adminId: request.user!.id,
        ip: request.ip
      });

      await this.categoryService.updateSortOrder(id, sortOrder);
      
      logger.info('Category sort order updated successfully', {
        categoryId: id,
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
      
      // Handle specific validation errors
      if (error.message.includes('not found')) {
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
        message: 'Failed to update sort order',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/admin/stats (Auth required - ADMIN)
  async getCategoryStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Fetching category stats', {
        adminId: request.user!.id,
        ip: request.ip
      });

      const stats = await this.categoryService.getCategoryStats();
      
      logger.info('Category stats fetched successfully', {
        adminId: request.user!.id,
        categoriesCount: stats.length,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: stats,
        meta: {
          totalCategories: stats.length,
          fetchedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Get category stats error:', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        ip: request.ip
      });

      return reply.status(500).send({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get category stats',
        statusCode: 500
      });
    }
  }

  // PUT /api/categories/bulk-sort-order (Auth required - ADMIN)
  async bulkUpdateSortOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categories } = request.body as { categories: Array<{ id: string; sortOrder: number }> };

      // Input validation
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

      logger.info('Bulk updating category sort orders', {
        categoriesCount: categories.length,
        categoryIds: categories.map(c => c.id),
        adminId: request.user!.id,
        ip: request.ip
      });

      await this.categoryService.bulkUpdateSortOrder(categories);
      
      logger.info('Bulk category sort order updated successfully', {
        categoriesCount: categories.length,
        categoryIds: categories.map(c => c.id),
        adminId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: `${categories.length} categories sort order updated successfully`,
        meta: {
          updatedCount: categories.length,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Bulk update sort order error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      // Handle specific validation errors
      if (error.message.includes('required') || error.message.includes('valid')) {
        return reply.status(400).send({ 
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }

      if (error.message.includes('not found')) {
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
        message: 'Failed to bulk update sort order',
        statusCode: 500
      });
    }
  }

  // Helper method for safe JSON parsing
  private safeParseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      logger.warn('Invalid JSON in query filters', { jsonString });
      return {};
    }
  }

  // GET /api/categories/popular - Get popular categories by post count
  async getPopularCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = Math.min(parseInt(query.limit) || 10, 20);
      
      logger.info('Fetching popular categories', {
        limit,
        ip: request.ip
      });

      const stats = await this.categoryService.getCategoryStats();
      const popularCategories = stats
        .sort((a, b) => b.postsCount - a.postsCount)
        .slice(0, limit);
      
      logger.info('Popular categories fetched successfully', {
        count: popularCategories.length,
        limit,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: popularCategories
      });
    } catch (error: any) {
      logger.error('Get popular categories error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch popular categories',
        statusCode: 500
      });
    }
  }

  // GET /api/categories/count - Get categories count statistics
  async getCategoriesCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Fetching categories count', {
        ip: request.ip
      });

      const stats = await this.categoryService.getCategoryStats();
      const activeCount = stats.filter(cat => cat.isActive).length;
      const inactiveCount = stats.length - activeCount;
      
      const countData = {
        total: stats.length,
        active: activeCount,
        inactive: inactiveCount
      };
      
      logger.info('Categories count fetched successfully', {
        ...countData,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        data: countData
      });
    } catch (error: any) {
      logger.error('Get categories count error:', {
        error: error.message,
        stack: error.stack,
        ip: request.ip
      });
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get categories count',
        statusCode: 500
      });
    }
  }
}