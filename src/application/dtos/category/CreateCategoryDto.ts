export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}