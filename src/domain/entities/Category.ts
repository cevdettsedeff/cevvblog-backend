// src/domain/entities/Category.ts

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Prisma count relations
  _count?: {
    blogPosts: number;
  };
}

// Utility functions for business logic
export const CategoryUtils = {
  isAvailableForPosts(category: Category): boolean {
    return category.isActive;
  },

  create(data: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    sortOrder?: number;
  }): Omit<Category, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      color: data.color || null,
      icon: data.icon || null,
      isActive: true,
      sortOrder: data.sortOrder || 0,
    };
  },

  validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  },

  validateColor(color: string): boolean {
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    return colorRegex.test(color);
  }
};