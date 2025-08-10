import { PostStatus } from "../../../domain/enums/PostStatus";

export interface BlogPostResponseDto {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  images: string[];
  tags: string[];
  status: PostStatus; // Use enum for consistency
  viewCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
  };
  commentsCount: number;
}