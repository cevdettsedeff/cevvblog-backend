import { inject, injectable } from "inversify";
import { IBlogPostService } from "../../core/interfaces/Services/IBlogPostService";
import { IBlogPostRepository } from "../../core/interfaces/Repositories/IBlogPostRepository";
import { ICategoryRepository } from "../../core/interfaces/Repositories/ICategoryRepository";
import { TYPES } from "../../core/container/types";
import { BlogPostResponseDto } from "../dtos/blogPost/BlogPostResponseDto";
import { IPaginatedResult } from "../../core/interfaces/Common/IPaginatedResult";
import { IFindAllOptions } from "../../core/interfaces/Common/IFindAllOptions";
import { CreateBlogPostDto } from "../dtos/blogPost/CreateBlogPostDto";
import { NotFoundError, ValidationError } from "../../core/errors";
import slugify from "slugify";
import { PostStatus } from "../../domain/enums/PostStatus";
import { BlogPost } from "../../domain/entities/BlogPost";
import { UpdateBlogPostDto } from "../dtos/blogPost/UpdateBlogPostDto";

@injectable()
export class BlogPostService implements IBlogPostService {
  constructor(
    @inject(TYPES.IBlogPostRepository) private blogPostRepository: IBlogPostRepository,
    @inject(TYPES.ICategoryRepository) private categoryRepository: ICategoryRepository
  ) {}

  async getById(id: string): Promise<BlogPostResponseDto | null> {
    const blogPost = await this.blogPostRepository.findById(id);
    return blogPost ? this.mapToDto(blogPost) : null;
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    const result = await this.blogPostRepository.findAll(options);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async create(dto: CreateBlogPostDto, authorId: string): Promise<BlogPostResponseDto> {
    // Category is required
    if (!dto.categoryId) {
      throw new ValidationError('Category is required for all blog posts');
    }

    // Verify category exists
    const categoryExists = await this.categoryRepository.exists(dto.categoryId);
    if (!categoryExists) {
      throw new NotFoundError('Category not found', { categoryId: dto.categoryId });
    }

    // Basic validation
    if (!dto.title || dto.title.trim().length < 5) {
      throw new ValidationError('Title must be at least 5 characters long');
    }

    if (!dto.content || dto.content.trim().length < 50) {
      throw new ValidationError('Content must be at least 50 characters long');
    }

    if (dto.tags && dto.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }

    if (dto.excerpt && dto.excerpt.length > 500) {
      throw new ValidationError('Excerpt cannot exceed 500 characters');
    }

    // Generate unique slug
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    const isPublishing = dto.status === PostStatus.PUBLISHED || dto.isPublished;

    const blogPostData: Partial<BlogPost> = {
      ...dto,
      slug,
      authorId,
      categoryId: dto.categoryId,
      status: dto.status || PostStatus.DRAFT,
      isPublished: isPublishing,
      publishedAt: isPublishing ? new Date() : undefined,
      viewCount: 0,
      commentsCount: 0,
    };

    const blogPost = await this.blogPostRepository.create(blogPostData);
    return this.mapToDto(blogPost);
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostResponseDto> {
    const existingPost = await this.blogPostRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    // If category is being changed, verify it exists
    if (dto.categoryId) {
      const categoryExists = await this.categoryRepository.exists(dto.categoryId);
      if (!categoryExists) {
        throw new NotFoundError('Category not found', { categoryId: dto.categoryId });
      }
    }

    // Basic validation for updates
    if (dto.title && dto.title.trim().length < 5) {
      throw new ValidationError('Title must be at least 5 characters long');
    }

    if (dto.content && dto.content.trim().length < 50) {
      throw new ValidationError('Content must be at least 50 characters long');
    }

    if (dto.tags && dto.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }

    if (dto.excerpt && dto.excerpt.length > 500) {
      throw new ValidationError('Excerpt cannot exceed 500 characters');
    }

    const updateData: any = { ...dto };

    // Generate new slug if title changed
    if (dto.title && dto.title !== existingPost.title) {
      const baseSlug = slugify(dto.title, { lower: true, strict: true });
      updateData.slug = await this.generateUniqueSlug(baseSlug, id);
    }

    // Set publish date when publishing for first time
    if (dto.isPublished && !existingPost.isPublished) {
      updateData.publishedAt = new Date();
      updateData.status = PostStatus.PUBLISHED;
    }

    // When unpublishing, change status but keep publishedAt for historical record
    if (dto.isPublished === false && existingPost.isPublished) {
      updateData.status = PostStatus.DRAFT;
      // Keep publishedAt for audit trail
    }

    const blogPost = await this.blogPostRepository.update(id, updateData);
    return this.mapToDto(blogPost);
  }

  async delete(id: string): Promise<boolean> {
    const existingPost = await this.blogPostRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    return await this.blogPostRepository.delete(id);
  }

  async getBySlug(slug: string): Promise<BlogPostResponseDto | null> {
    const blogPost = await this.blogPostRepository.findBySlug(slug);
    return blogPost ? this.mapToDto(blogPost) : null;
  }

  async getPublished(options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options?.filters,
        isPublished: true,
        status: PostStatus.PUBLISHED,
      },
    };

    const result = await this.blogPostRepository.findAll(searchOptions);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async getByCategory(categorySlug: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    // Find category by slug first
    const category = await this.categoryRepository.findBySlug(categorySlug);
    if (!category) {
      throw new NotFoundError('Category not found', { categorySlug });
    }

    const searchOptions = {
      ...options,
      filters: {
        ...options?.filters,
        categoryId: category.id,
        isPublished: true,
        status: PostStatus.PUBLISHED,
      },
    };

    const result = await this.blogPostRepository.findAll(searchOptions);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async getByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options?.filters,
        authorId,
      },
    };

    const result = await this.blogPostRepository.findAll(searchOptions);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async incrementViewCount(id: string): Promise<void> {
    const exists = await this.blogPostRepository.exists(id);
    if (!exists) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    await this.blogPostRepository.incrementViewCount(id);
  }

  async getPopular(limit: number = 10): Promise<BlogPostResponseDto[]> {
    if (limit <= 0 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100', { limit });
    }

    const posts = await this.blogPostRepository.findPopular(limit);
    return posts.map((post) => this.mapToDto(post));
  }

  async getRecent(limit: number = 10): Promise<BlogPostResponseDto[]> {
    if (limit <= 0 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100', { limit });
    }

    const posts = await this.blogPostRepository.findRecent(limit);
    return posts.map((post) => this.mapToDto(post));
  }

  async getTrending(limit: number = 10, days: number = 7): Promise<BlogPostResponseDto[]> {
    if (limit <= 0 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100', { limit });
    }

    if (days <= 0 || days > 365) {
      throw new ValidationError('Days must be between 1 and 365', { days });
    }

    const posts = await this.blogPostRepository.findTrending(limit, days);
    return posts.map((post: BlogPost) => this.mapToDto(post));
  }

  async searchPosts(query: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query cannot be empty');
    }

    if (query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long', { query });
    }

    const searchOptions = {
      ...options,
      filters: {
        ...options?.filters,
        OR: [
          { title: { contains: query.trim(), mode: "insensitive" } },
          { content: { contains: query.trim(), mode: "insensitive" } },
          { excerpt: { contains: query.trim(), mode: "insensitive" } },
          { tags: { has: query.trim() } },
        ],
        isPublished: true,
        status: PostStatus.PUBLISHED,
      },
    };

    const result = await this.blogPostRepository.findAll(searchOptions);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async getDrafts(authorId?: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPostResponseDto>> {
    const searchOptions = {
      ...options,
      filters: {
        ...options?.filters,
        status: PostStatus.DRAFT,
        isPublished: false,
        ...(authorId && { authorId }),
      },
    };

    const result = await this.blogPostRepository.findAll(searchOptions);
    return {
      data: result.data.map((post) => this.mapToDto(post)),
      pagination: result.pagination,
    };
  }

  async publish(id: string): Promise<BlogPostResponseDto> {
    const existingPost = await this.blogPostRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    if (existingPost.isPublished) {
      throw new ValidationError('Post is already published', { postId: id });
    }

    // Ensure post has required category before publishing
    if (!existingPost.categoryId) {
      throw new ValidationError('Cannot publish post without a category', { postId: id });
    }

    const updateData = {
      isPublished: true,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    };

    const blogPost = await this.blogPostRepository.update(id, updateData);
    return this.mapToDto(blogPost);
  }

  async unpublish(id: string): Promise<BlogPostResponseDto> {
    const existingPost = await this.blogPostRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    if (!existingPost.isPublished) {
      throw new ValidationError('Post is not published', { postId: id });
    }

    const updateData = {
      isPublished: false,
      status: PostStatus.DRAFT,
      // Keep publishedAt for historical record
    };

    const blogPost = await this.blogPostRepository.update(id, updateData);
    return this.mapToDto(blogPost);
  }

  async getPostStats(id: string): Promise<any> {
    const existingPost = await this.blogPostRepository.findById(id);
    if (!existingPost) {
      throw new NotFoundError('Blog post not found', { postId: id });
    }

    // Get category name if needed
    let categoryName = null;
    if (existingPost.categoryId) {
      const category = await this.categoryRepository.findById(existingPost.categoryId);
      categoryName = category?.name || null;
    }

    return {
      viewCount: existingPost.viewCount,
      commentsCount: existingPost.commentsCount,
      isPublished: existingPost.isPublished,
      publishedAt: existingPost.publishedAt,
      createdAt: existingPost.createdAt,
      updatedAt: existingPost.updatedAt,
      tags: existingPost.tags,
      categoryId: existingPost.categoryId,
      categoryName: categoryName, // ✅ FIXED: Use separate query to get category name
      readingTime: this.calculateReadingTime(existingPost.content),
      status: existingPost.status,
    };
  }

  private calculateReadingTime(content: string): number {
    // Average reading speed is 200-250 words per minute
    const wordsPerMinute = 225;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private mapToDto(blogPost: any): BlogPostResponseDto {
    // Category is always required - throw error if missing
    if (!blogPost.category) {
      throw new Error(`Blog post ${blogPost.id} is missing required category`);
    }

    return {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      featuredImage: blogPost.featuredImage,
      images: blogPost.images || [],
      tags: blogPost.tags || [],
      status: blogPost.status,
      viewCount: blogPost.viewCount || 0,
      commentsCount: blogPost._count?.comments || blogPost.commentsCount || 0,
      isPublished: blogPost.isPublished,
      publishedAt: blogPost.publishedAt,
      createdAt: blogPost.createdAt,
      updatedAt: blogPost.updatedAt,
      author: {
        id: blogPost.author?.id || '',
        username: blogPost.author?.username || '',
        firstName: blogPost.author?.firstName || '',
        lastName: blogPost.author?.lastName || '',
        avatar: blogPost.author?.avatar,
      },
      category: {
        id: blogPost.category.id,
        name: blogPost.category.name,
        slug: blogPost.category.slug,
        color: blogPost.category.color,
        icon: blogPost.category.icon,
      },
    };
  }

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    const maxAttempts = 100;

    while (counter <= maxAttempts) {
      const existing = await this.blogPostRepository.findBySlug(slug);
      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (counter > maxAttempts) {
      // Fallback to timestamp-based slug
      slug = `${baseSlug}-${Date.now()}`;
    }

    return slug;
  }
}