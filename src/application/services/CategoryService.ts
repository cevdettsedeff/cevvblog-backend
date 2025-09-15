// src/application/services/CategoryService.ts

import { inject, injectable } from "inversify";
import { TYPES } from "../../core/container/types";
import { ICategoryRepository } from "../../core/interfaces/Repositories/ICategoryRepository";
import { CategoryResponseDto } from "../dtos/category/CategoryResponseDto";
import { IPaginatedResult } from "../../core/interfaces/Common/IPaginatedResult";
import { IFindAllOptions } from "../../core/interfaces/Common/IFindAllOptions";
import { CreateCategoryDto } from "../dtos/category/CreateCategoryDto";
import slugify from "slugify";
import { UpdateCategoryDto } from "../dtos/category/UpdateCategoryDto";
import { ICategoryService } from "../../core/interfaces/Services/ICategoryService";
import { Category, CategoryUtils } from "../../domain/entities/Category";

@injectable()
export class CategoryService implements ICategoryService {
  constructor(@inject(TYPES.ICategoryRepository) private categoryRepository: ICategoryRepository) {}

  async getById(id: string): Promise<CategoryResponseDto | null> {
    try {
      if (!id || id.trim() === "") {
        return null;
      }

      const category = await this.categoryRepository.findById(id);
      return category ? this.mapToDto(category) : null;
    } catch (error) {
      console.error("CategoryService.getById error:", error);
      return null;
    }
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<CategoryResponseDto>> {
    try {
      const result = await this.categoryRepository.findAll(options);
      return {
        data: result.data.map((category) => this.mapToDto(category)),
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("CategoryService.getAll error:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    try {
      if (!dto.name || dto.name.trim() === "") {
        throw new Error("Category name is required");
      }

      // Generate slug from name
      const slug = slugify(dto.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });

      // Validate slug format
      if (!CategoryUtils.validateSlug(slug)) {
        throw new Error("Generated slug is invalid");
      }

      // Validate color if provided
      if (dto.color && !CategoryUtils.validateColor(dto.color)) {
        throw new Error("Invalid color format. Use hex format like #3b82f6");
      }

      // Check if slug already exists
      const existingCategory = await this.categoryRepository.findBySlug(slug);
      if (existingCategory) {
        throw new Error("Category with this name already exists");
      }

      // Create category data using utility
      const categoryData = CategoryUtils.create({
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
        color: dto.color,
        icon: dto.icon,
        sortOrder: dto.sortOrder,
      });

      const category = await this.categoryRepository.create(categoryData);
      return this.mapToDto(category);
    } catch (error) {
      console.error("CategoryService.create error:", error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    try {
      if (!id || id.trim() === "") {
        throw new Error("Category ID is required");
      }

      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(id);
      if (!existingCategory) {
        throw new Error("Category not found");
      }

      const updateData: Partial<Category> = {};

      // Handle name and slug update
      if (dto.name && dto.name.trim() !== "") {
        const newSlug = slugify(dto.name, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });

        // Validate new slug
        if (!CategoryUtils.validateSlug(newSlug)) {
          throw new Error("Generated slug is invalid");
        }

        // Check if new slug conflicts with existing category
        if (newSlug !== existingCategory.slug) {
          const slugConflict = await this.categoryRepository.findBySlug(newSlug);
          if (slugConflict && slugConflict.id !== id) {
            throw new Error("Category with this name already exists");
          }
          updateData.slug = newSlug;
        }

        updateData.name = dto.name.trim();
      }

      // Handle other fields
      if (dto.description !== undefined) {
        updateData.description = dto.description.trim() || null;
      }

      if (dto.color !== undefined) {
        if (dto.color && !CategoryUtils.validateColor(dto.color)) {
          throw new Error("Invalid color format. Use hex format like #3b82f6");
        }
        updateData.color = dto.color;
      }

      if (dto.icon !== undefined) {
        updateData.icon = dto.icon;
      }

      if (dto.isActive !== undefined) {
        updateData.isActive = dto.isActive;
      }

      if (dto.sortOrder !== undefined) {
        if (dto.sortOrder < 0) {
          throw new Error("Sort order cannot be negative");
        }
        updateData.sortOrder = dto.sortOrder;
      }

      const category = await this.categoryRepository.update(id, updateData);
      return this.mapToDto(category);
    } catch (error) {
      console.error("CategoryService.update error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!id || id.trim() === "") {
        return false;
      }

      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(id);
      if (!existingCategory) {
        return false;
      }

      return await this.categoryRepository.delete(id);
    } catch (error) {
      console.error("CategoryService.delete error:", error);
      return false;
    }
  }

  async getBySlug(slug: string): Promise<CategoryResponseDto | null> {
    try {
      if (!slug || slug.trim() === "") {
        return null;
      }

      // Validate slug format
      if (!CategoryUtils.validateSlug(slug)) {
        return null;
      }

      const category = await this.categoryRepository.findBySlug(slug);
      return category ? this.mapToDto(category) : null;
    } catch (error) {
      console.error("CategoryService.getBySlug error:", error);
      return null;
    }
  }

  async getActive(): Promise<CategoryResponseDto[]> {
    try {
      const categories = await this.categoryRepository.findActive();

      // Filter using business logic
      const activeCategories = categories.filter((category) => CategoryUtils.isAvailableForPosts(category));

      return activeCategories.map((category) => this.mapToDto(category));
    } catch (error) {
      console.error("CategoryService.getActive error:", error);
      return [];
    }
  }

  async updateSortOrder(categoryId: string, sortOrder: number): Promise<void> {
    try {
      if (!categoryId || categoryId.trim() === "") {
        throw new Error("Category ID is required");
      }

      if (sortOrder < 0) {
        throw new Error("Sort order cannot be negative");
      }

      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(categoryId);
      if (!existingCategory) {
        throw new Error("Category not found");
      }

      await this.categoryRepository.updateSortOrder(categoryId, sortOrder);
    } catch (error) {
      console.error("CategoryService.updateSortOrder error:", error);
      throw error;
    }
  }

  private mapToDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      color: category.color || "#3b82f6",
      icon: category.icon || "folder",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postsCount: category._count?.blogPosts || 0,
    };
  }

  async getCategoryStats(): Promise<any[]> {
    try {
      const categories = await this.categoryRepository.findWithPostCount();
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        postsCount: category._count?.blogPosts || 0,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        isAvailable: CategoryUtils.isAvailableForPosts(category),
      }));
    } catch (error) {
      console.error("CategoryService.getCategoryStats error:", error);
      return [];
    }
  }

  async bulkUpdateSortOrder(categories: Array<{ id: string; sortOrder: number }>): Promise<void> {
    try {
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        throw new Error("Categories array is required");
      }

      // Validate all categories first
      for (const cat of categories) {
        if (!cat.id || cat.id.trim() === "") {
          throw new Error("All categories must have valid IDs");
        }
        if (typeof cat.sortOrder !== "number" || cat.sortOrder < 0) {
          throw new Error("All categories must have valid sort orders");
        }
      }

      // Verify all categories exist
      for (const cat of categories) {
        const exists = await this.categoryRepository.findById(cat.id);
        if (!exists) {
          throw new Error(`Category with ID ${cat.id} not found`);
        }
      }

      // Update all sort orders using Promise.all for better performance
      await Promise.all(categories.map((cat) => this.categoryRepository.updateSortOrder(cat.id, cat.sortOrder)));
    } catch (error) {
      console.error("CategoryService.bulkUpdateSortOrder error:", error);
      throw error;
    }
  }

  async getPopularCategories(limit: number = 10): Promise<CategoryResponseDto[]> {
    try {
      if (limit <= 0 || limit > 50) {
        throw new Error("Limit must be between 1 and 50");
      }

      const popularCategories = await this.categoryRepository.findPopular(limit);
      return popularCategories.map((category) => this.mapToDto(category));
    } catch (error) {
      console.error("CategoryService.getPopularCategories error:", error);
      throw error;
    }
  }

  async getCategoriesCount(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const counts = await this.categoryRepository.getCategoryCounts();
      return counts;
    } catch (error) {
      console.error("CategoryService.getCategoriesCount error:", error);
      throw error;
    }
  }
}
