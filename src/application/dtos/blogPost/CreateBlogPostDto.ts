import { PostStatus } from "../../../domain/enums/PostStatus";

export interface CreateBlogPostDto {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tags?: string[];
  featuredImage?: string;
  images?: string[];
  status?: PostStatus; // Use enum instead of string literals
  isPublished?: boolean;
}