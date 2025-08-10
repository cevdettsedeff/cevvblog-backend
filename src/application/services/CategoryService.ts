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

@injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @inject(TYPES.ICategoryRepository) private categoryRepository: ICategoryRepository
  ) {}

  async getById(id: string): Promise<CategoryResponseDto | null> {
    const category = await this.categoryRepository.findById(id);
    return category ? this.mapToDto(category) : null;
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<CategoryResponseDto>> {
    const result = await this.categoryRepository.findAll(options);
    return {
      data: result.data.map(category => this.mapToDto(category)),
      pagination: result.pagination,
    };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const slug = slugify(dto.name, { lower: true, strict: true });
    
    const categoryData = {
      ...dto,
      slug,
      sortOrder: dto.sortOrder || 0,
    };

    const category = await this.categoryRepository.create(categoryData);
    return this.mapToDto(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const updateData: any = { ...dto };
    
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true, strict: true });
    }

    const category = await this.categoryRepository.update(id, updateData);
    return this.mapToDto(category);
  }

  async delete(id: string): Promise<boolean> {
    return await this.categoryRepository.delete(id);
  }

  async getBySlug(slug: string): Promise<CategoryResponseDto | null> {
    const category = await this.categoryRepository.findBySlug(slug);
    return category ? this.mapToDto(category) : null;
  }

  async getActive(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findActive();
    return categories.map(category => this.mapToDto(category));
  }

  async updateSortOrder(categoryId: string, sortOrder: number): Promise<void> {
    await this.categoryRepository.updateSortOrder(categoryId, sortOrder);
  }

  private mapToDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postsCount: category._count?.blogPosts || 0,
    };
  }

  async getCategoryStats(): Promise<any[]> {
  return await this.categoryRepository.findWithPostCount();
}

async bulkUpdateSortOrder(categories: Array<{ id: string; sortOrder: number }>): Promise<void> {
  // Transaction kullanarak toplu güncelleme
  await Promise.all(
    categories.map(cat => 
      this.categoryRepository.updateSortOrder(cat.id, cat.sortOrder)
    )
  );
}

}