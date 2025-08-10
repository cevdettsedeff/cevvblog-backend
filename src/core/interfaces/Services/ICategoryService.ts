import { CategoryResponseDto } from "../../../application/dtos/category/CategoryResponseDto";
import { CreateCategoryDto } from "../../../application/dtos/category/CreateCategoryDto";
import { UpdateCategoryDto } from "../../../application/dtos/category/UpdateCategoryDto";
import { IService } from "../IService";

export interface ICategoryService extends IService<CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto> {
  getBySlug(slug: string): Promise<CategoryResponseDto | null>;
  getActive(): Promise<CategoryResponseDto[]>;
  updateSortOrder(categoryId: string, sortOrder: number): Promise<void>;
  getCategoryStats(): Promise<any[]>;
  bulkUpdateSortOrder(categories: Array<{ id: string; sortOrder: number }>): Promise<void>;
}