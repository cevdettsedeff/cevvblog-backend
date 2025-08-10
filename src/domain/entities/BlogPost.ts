import { PostStatus } from "../enums/PostStatus";

export class BlogPost {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly content: string,
    public readonly authorId: string,
    public readonly categoryId: string,
    public readonly excerpt?: string,
    public readonly featuredImage?: string,
    public readonly images: string[] = [],
    public readonly tags: string[] = [],
    public readonly status: PostStatus = PostStatus.DRAFT,
    public readonly viewCount: number = 0,
    public readonly commentsCount: number = 0,
    public readonly isPublished: boolean = false,
    public readonly publishedAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  public isPublic(): boolean {
    return this.isPublished && this.status === PostStatus.PUBLISHED;
  }

  public canBeViewed(): boolean {
    return this.isPublic();
  }

  public incrementView(): BlogPost {
    return new BlogPost(
      this.id,
      this.title,
      this.slug,
      this.content,
      this.authorId,
      this.categoryId,
      this.excerpt,
      this.featuredImage,
      this.images,
      this.tags,
      this.status,
      this.viewCount + 1,
      this.commentsCount,
      this.isPublished,
      this.publishedAt,
      this.createdAt,
      this.updatedAt
    );
  }

  public publish(): BlogPost {
    return new BlogPost(
      this.id,
      this.title,
      this.slug,
      this.content,
      this.authorId,
      this.categoryId,
      this.excerpt,
      this.featuredImage,
      this.images,
      this.tags,
      PostStatus.PUBLISHED,
      this.viewCount,
      this.commentsCount,
      true,
      new Date(),
      this.createdAt,
      new Date()
    );
  }

  public unpublish(): BlogPost {
    if (!this.isPublished) {
      throw new Error('Post is not published');
    }

    return new BlogPost(
      this.id,
      this.title,
      this.slug,
      this.content,
      this.authorId,
      this.categoryId,
      this.excerpt,
      this.featuredImage,
      this.images,
      this.tags,
      PostStatus.DRAFT,
      this.viewCount,
      this.commentsCount,
      false,
      this.publishedAt,
      this.createdAt,
      new Date() 
    );
  }

  public archive(): BlogPost {
    return new BlogPost(
      this.id,
      this.title,
      this.slug,
      this.content,
      this.authorId,
      this.categoryId,
      this.excerpt,
      this.featuredImage,
      this.images,
      this.tags,
      PostStatus.ARCHIVED,
      this.viewCount,
      this.commentsCount,
      false,
      this.publishedAt,
      this.createdAt,
      new Date()
    );
  }

  public updateContent(data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    images?: string[];
    tags?: string[];
    categoryId?: string;
  }): BlogPost {
    return new BlogPost(
      this.id,
      data.title ?? this.title,
      data.slug ?? this.slug,
      data.content ?? this.content,
      this.authorId,
      data.categoryId ?? this.categoryId,
      data.excerpt ?? this.excerpt,
      data.featuredImage ?? this.featuredImage,
      data.images ?? this.images,
      data.tags ?? this.tags,
      this.status,
      this.viewCount,
      this.commentsCount,
      this.isPublished,
      this.publishedAt,
      this.createdAt,
      new Date() 
    );
  }

  public static create(data: {
    title: string;
    slug: string;
    content: string;
    authorId: string;
    categoryId: string; // ✅ REQUIRED: Category is mandatory
    excerpt?: string;
    featuredImage?: string;
    images?: string[];
    tags?: string[];
    status?: PostStatus;
    isPublished?: boolean;
  }): BlogPost {
    // ✅ VALIDATION: Ensure required fields
    if (!data.title?.trim()) {
      throw new Error('Title is required');
    }
    
    if (!data.content?.trim()) {
      throw new Error('Content is required');
    }
    
    if (!data.authorId?.trim()) {
      throw new Error('Author ID is required');
    }
    
    if (!data.categoryId?.trim()) {
      throw new Error('Category ID is required');
    }
    
    if (!data.slug?.trim()) {
      throw new Error('Slug is required');
    }

    // ✅ VALIDATION: Length checks
    if (data.title.trim().length < 5) {
      throw new Error('Title must be at least 5 characters long');
    }
    
    if (data.content.trim().length < 50) {
      throw new Error('Content must be at least 50 characters long');
    }

    // ✅ VALIDATION: Tags limit
    if (data.tags && data.tags.length > 10) {
      throw new Error('Maximum 10 tags allowed');
    }

    // ✅ VALIDATION: Excerpt length
    if (data.excerpt && data.excerpt.length > 500) {
      throw new Error('Excerpt cannot exceed 500 characters');
    }

    const isPublishing = data.isPublished || data.status === PostStatus.PUBLISHED;
    const now = new Date();

    return new BlogPost(
      '', // ID will be generated by database
      data.title.trim(),
      data.slug.trim(),
      data.content.trim(),
      data.authorId.trim(),
      data.categoryId.trim(),
      data.excerpt?.trim(),
      data.featuredImage,
      data.images || [],
      data.tags || [],
      data.status || PostStatus.DRAFT,
      0, // Initial view count
      0, // Initial comments count
      isPublishing,
      isPublishing ? now : undefined, // ✅ FIXED: Set publishedAt only when publishing
      now,
      now
    );
  }

  // ✅ ADDED: Factory method for creating from database data
  public static fromDatabase(data: any): BlogPost {
    return new BlogPost(
      data.id,
      data.title,
      data.slug,
      data.content,
      data.authorId,
      data.categoryId,
      data.excerpt,
      data.featuredImage,
      data.images || [],
      data.tags || [],
      data.status,
      data.viewCount || 0,
      data.commentsCount || 0,
      data.isPublished || false,
      data.publishedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  // ✅ ADDED: Convert to plain object for database operations
  public toPlainObject(): any {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      content: this.content,
      authorId: this.authorId,
      categoryId: this.categoryId,
      excerpt: this.excerpt,
      featuredImage: this.featuredImage,
      images: this.images,
      tags: this.tags,
      status: this.status,
      viewCount: this.viewCount,
      commentsCount: this.commentsCount,
      isPublished: this.isPublished,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ✅ ADDED: Validation method
  public validate(): string[] {
    const errors: string[] = [];

    if (!this.title?.trim()) {
      errors.push('Title is required');
    } else if (this.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    } else if (this.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (!this.content?.trim()) {
      errors.push('Content is required');
    } else if (this.content.trim().length < 50) {
      errors.push('Content must be at least 50 characters long');
    }

    if (!this.authorId?.trim()) {
      errors.push('Author ID is required');
    }

    if (!this.categoryId?.trim()) {
      errors.push('Category ID is required');
    }

    if (!this.slug?.trim()) {
      errors.push('Slug is required');
    }

    if (this.excerpt && this.excerpt.length > 500) {
      errors.push('Excerpt cannot exceed 500 characters');
    }

    if (this.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    if (this.isPublished && !this.publishedAt) {
      errors.push('Published posts must have a published date');
    }

    return errors;
  }

  // ✅ ADDED: Check if post is valid
  public isValid(): boolean {
    return this.validate().length === 0;
  }

   public updateCommentsCount(count: number): BlogPost {
    return new BlogPost(
      this.id,
      this.title,
      this.slug,
      this.content,
      this.authorId,
      this.categoryId,
      this.excerpt,
      this.featuredImage,
      this.images,
      this.tags,
      this.status,
      this.viewCount,
      Math.max(0, count), // ✅ Ensure non-negative count
      this.isPublished,
      this.publishedAt,
      this.createdAt,
      new Date()
    );
  }

  // ✅ ADDED: Reading time calculation (approximate)
  public getReadingTime(): number {
    const wordsPerMinute = 225;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // ✅ ADDED: Content preview method
  public getPreview(maxLength: number = 150): string {
    if (this.excerpt) {
      return this.excerpt;
    }
    
    // Strip HTML tags and get text content
    const textContent = this.content.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLength) {
      return textContent;
    }
    
    return textContent.substring(0, maxLength).trim() + '...';
  }
}