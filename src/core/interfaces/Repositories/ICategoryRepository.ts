import { Category } from "../../../domain/entities/Category";
import { IRepository } from "../IRepository";

export interface ICategoryRepository extends IRepository<Category> {
  findBySlug(slug: string): Promise<Category | null>;
  findActive(): Promise<Category[]>;
  updateSortOrder(categoryId: string, sortOrder: number): Promise<void>;
  findWithPostCount(): Promise<Category[]>;
}