import { BlogPostResponseDto } from "../../../application/dtos/blogPost/BlogPostResponseDto";
import { CreateBlogPostDto } from "../../../application/dtos/blogPost/CreateBlogPostDto";
import { UpdateBlogPostDto } from "../../../application/dtos/blogPost/UpdateBlogPostDto";
import { IFindAllOptions } from "../Common/IFindAllOptions";
import { IPaginatedResult } from "../Common/IPaginatedResult";
import { IService } from "../IService";

export interface IBlogPostService {
  getById(id: string): Promise<BlogPostResponseDto | null>;
  getAll(options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>>;
  create(dto: CreateBlogPostDto, authorId: string): Promise<BlogPostResponseDto>; 
  update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostResponseDto>;
  delete(id: string): Promise<boolean>;
  getBySlug(slug: string): Promise<BlogPostResponseDto | null>;
  getPublished(options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>>;
  getByCategory(categorySlug: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>>;
  getByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>>;
  incrementViewCount(id: string): Promise<void>;
  getPopular(limit?: number): Promise<BlogPostResponseDto[]>;
  getRecent(limit?: number): Promise<BlogPostResponseDto[]>;
  searchPosts(query: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>>;
  getTrending(limit?: number, days?: number): Promise<BlogPostResponseDto[]>;
}