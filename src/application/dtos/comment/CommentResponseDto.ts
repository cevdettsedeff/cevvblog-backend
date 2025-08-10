import { CommentStatus } from "../../../domain/enums/CommentStatus";

export interface CommentResponseDto {
  id: string;
  content: string;
  status: CommentStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  blogPost: {
    id: string;
    title: string;
    slug: string;
  };
  parent?: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  replies?: CommentResponseDto[];
  repliesCount: number;
}
