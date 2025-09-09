import { Category } from "../../../domain/entities/Category";
import { IRepository } from "../IRepository";

export interface ICategoryRepository extends IRepository<Category> {
  findBySlug(slug: string): Promise<Category | null>;
  findActive(): Promise<Category[]>;
  updateSortOrder(categoryId: string, sortOrder: number): Promise<void>;
  findWithPostCount(): Promise<Category[]>;
  findPopular(limit: number): Promise<Category[]>;
  getCategoryCounts(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }>;
}