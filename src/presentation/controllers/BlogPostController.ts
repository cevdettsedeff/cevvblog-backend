// 3. BlogPost Controller (presentation/controllers/BlogPostController.ts)
import { injectable, inject } from 'inversify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { TYPES } from '../../core/container/types';
import logger from '../../utils/logger';
import { IBlogPostService } from '../../core/interfaces/Services/IBlogPostService';
import { IImageService } from '../../core/interfaces/Services/IImageService';
import { CreateBlogPostDto } from '../../application/dtos/blogPost/CreateBlogPostDto';
import { UpdateBlogPostDto } from '../../application/dtos/blogPost/UpdateBlogPostDto';
import { MultipartFile } from '@fastify/multipart';

@injectable()
export class BlogPostController {
  constructor(
    @inject(TYPES.IBlogPostService) private blogPostService: IBlogPostService,
    @inject(TYPES.IImageService) private imageService: IImageService
  ) {}

  // GET /api/posts
  async getAllPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
        sortBy: query.sortBy || 'publishedAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.blogPostService.getPublished(options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch posts',
        statusCode: 500
      });
    }
  }

  async getTrendingPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = parseInt(query.limit) || 10;
      const days = parseInt(query.days) || 7;
      
      const posts = await this.blogPostService.getTrending(limit, days);
      
      return reply.send({
        success: true,
        data: posts,
        meta: {
          limit,
          days,
          count: posts.length
        }
      });
    } catch (error: any) {
      logger.error('Get trending posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      if (error.name === 'ValidationError') {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: error.message,
          statusCode: 400
        });
      }
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch trending posts',
        statusCode: 500
      });
    }
  }

  async getPostById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      // ✅ ADDED: Basic ID validation
      if (!id || id.trim() === '') {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Post ID is required',
          statusCode: 400
        });
      }

      const post = await this.blogPostService.getById(id);
      
      if (!post) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      // Only increment view count for published posts
      if (post.isPublished) {
        // Don't await this to avoid slowing down the response
        this.blogPostService.incrementViewCount(id).catch(err => 
          logger.error('View count increment error:', err)
        );
      }
      
      return reply.send({
        success: true,
        data: post,
      });
    } catch (error: any) {
      logger.error('Get post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch post',
        statusCode: 500
      });
    }
  }
  // GET /api/posts/slug/:slug
  async getPostBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const post = await this.blogPostService.getBySlug(slug);
      
      if (!post) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      // Only increment view count for published posts
      if (post.isPublished) {
        // Don't await this to avoid slowing down the response
        this.blogPostService.incrementViewCount(post.id).catch(err => 
          logger.error('View count increment error:', err)
        );
      }
      
      return reply.send({
        success: true,
        data: post,
      });
    } catch (error: any) {
      logger.error('Get post by slug error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch post',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/category/:categorySlug
  async getPostsByCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categorySlug } = request.params as { categorySlug: string };
      const query = request.query as any;
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
        sortBy: query.sortBy || 'publishedAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.blogPostService.getByCategory(categorySlug, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get posts by category error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch posts by category',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/popular
  async getPopularPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = parseInt(query.limit) || 10;
      
      const posts = await this.blogPostService.getPopular(limit);
      
      return reply.send({
        success: true,
        data: posts,
      });
    } catch (error: any) {
      logger.error('Get popular posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch popular posts',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/recent
  async getRecentPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const limit = parseInt(query.limit) || 10;
      
      const posts = await this.blogPostService.getRecent(limit);
      
      return reply.send({
        success: true,
        data: posts,
      });
    } catch (error: any) {
      logger.error('Get recent posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch recent posts',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/search
  async searchPosts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const searchQuery = query.q;
      
      if (!searchQuery) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Search query is required',
          statusCode: 400
        });
      }

      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
      };

      const result = await this.blogPostService.searchPosts(searchQuery, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
        query: searchQuery,
      });
    } catch (error: any) {
      logger.error('Search posts error:', {
        error: error.message,
        stack: error.stack,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to search posts',
        statusCode: 500
      });
    }
  }

  // POST /api/posts (Auth required - AUTHOR/ADMIN)
  async createPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const postData = request.body as CreateBlogPostDto;
      
      // Create post with author ID
      const post = await this.blogPostService.create(postData, request.user!.id);
      
      logger.info('Blog post created', {
        postId: post.id,
        postTitle: post.title,
        authorId: request.user!.id,
        isPublished: post.isPublished,
        ip: request.ip
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Post created successfully',
        data: post,
      });
    } catch (error: any) {
      logger.error('Create post error:', {
        error: error.message,
        stack: error.stack,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to create post',
        statusCode: 500
      });
    }
  }

  // PUT /api/posts/:id (Auth required - Owner/ADMIN)
  async updatePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateBlogPostDto;

      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to update this post',
          statusCode: 403
        });
      }

      const post = await this.blogPostService.update(id, updateData);
      
      logger.info('Blog post updated', {
        postId: id,
        postTitle: post.title,
        updatedFields: Object.keys(updateData),
        authorId: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Post updated successfully',
        data: post,
      });
    } catch (error: any) {
      logger.error('Update post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        body: request.body,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to update post',
        statusCode: 500
      });
    }
  }

  // DELETE /api/posts/:id (Auth required - Owner/ADMIN)
  async deletePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to delete this post',
          statusCode: 403
        });
      }

      const success = await this.blogPostService.delete(id);
      if (!success) {
        return reply.status(500).send({ 
          error: 'Internal Server Error',
          message: 'Failed to delete post',
          statusCode: 500
        });
      }

      logger.info('Blog post deleted', {
        postId: id,
        postTitle: existingPost.title,
        deletedBy: request.user!.id,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to delete post',
        statusCode: 500
      });
    }
  }

   async uploadImage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to upload images for this post',
          statusCode: 403
        });
      }

      // ✅ Fixed: Proper file handling with type safety
      const data: MultipartFile | undefined = await request.file();
      if (!data) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'No file uploaded',
          statusCode: 400
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
          statusCode: 400
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate file size (5MB max)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'File size too large. Maximum 5MB allowed',
          statusCode: 400
        });
      }

      const imageUrl = await this.imageService.uploadImage(
        buffer,
        data.filename,
        data.mimetype
      );

      logger.info('Image uploaded for blog post', {
        postId: id,
        imageUrl,
        fileName: data.filename,
        fileSize: buffer.length,
        authorId: request.user!.id,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl },
      });
    } catch (error: any) {
      logger.error('Upload image error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to upload image',
        statusCode: 500
      });
    }
  }

  // POST /api/posts/:id/upload-multiple-images (Auth required - Owner/ADMIN)
  async uploadMultipleImages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to upload images for this post',
          statusCode: 403
        });
      }

      const files: MultipartFile[] = [];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      const maxFiles = 10;

      // ✅ Process multiple files
      for await (const file of request.files()) {
        if (files.length >= maxFiles) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: `Maximum ${maxFiles} files allowed`,
            statusCode: 400
          });
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: `Invalid file type: ${file.filename}. Only JPEG, PNG, WebP, and GIF are allowed`,
            statusCode: 400
          });
        }

        const buffer = await file.toBuffer();
        if (buffer.length > maxFileSize) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: `File too large: ${file.filename}. Maximum 5MB allowed`,
            statusCode: 400
          });
        }

        files.push(file);
      }

      if (files.length === 0) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'No files uploaded',
          statusCode: 400
        });
      }

      // Upload all files
      const uploadPromises = files.map(async (file) => {
        const buffer = await file.toBuffer();
        return await this.imageService.uploadImage(buffer, file.filename, file.mimetype);
      });

      const imageUrls = await Promise.all(uploadPromises);

      logger.info('Multiple images uploaded for blog post', {
        postId: id,
        imageCount: imageUrls.length,
        imageUrls,
        authorId: request.user!.id,
        ip: request.ip
      });

      return reply.send({
        success: true,
        message: `${imageUrls.length} images uploaded successfully`,
        data: { imageUrls },
      });
    } catch (error: any) {
      logger.error('Upload multiple images error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to upload images',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/author/:authorId
  async getPostsByAuthor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { authorId } = request.params as { authorId: string };
      const query = request.query as any;
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
        sortBy: query.sortBy || 'publishedAt',
        sortOrder: query.sortOrder || 'desc',
      };

      const result = await this.blogPostService.getByAuthor(authorId, options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get posts by author error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch posts by author',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/drafts (Auth required - Own drafts or ADMIN)
  async getDrafts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const authorId = request.user!.role === 'ADMIN' ? undefined : request.user!.id;
      
      const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10,
        sortBy: query.sortBy || 'updatedAt',
        sortOrder: query.sortOrder || 'desc',
        filters: {
          status: 'DRAFT',
          ...(authorId && { authorId })
        }
      };

      const result = await this.blogPostService.getAll(options);
      
      return reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Get drafts error:', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        query: request.query,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch drafts',
        statusCode: 500
      });
    }
  }

  // PUT /api/posts/:id/publish (Auth required - Owner/ADMIN)
  async publishPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to publish this post',
          statusCode: 403
        });
      }

      if (existingPost.isPublished) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Post is already published',
          statusCode: 400
        });
      }

      const post = await this.blogPostService.update(id, {
        isPublished: true,
        status: 'PUBLISHED' as any
      });
      
      logger.info('Blog post published', {
        postId: id,
        postTitle: post.title,
        publishedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Post published successfully',
        data: post,
      });
    } catch (error: any) {
      logger.error('Publish post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to publish post',
        statusCode: 500
      });
    }
  }

  // PUT /api/posts/:id/unpublish (Auth required - Owner/ADMIN)
  async unpublishPost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to unpublish this post',
          statusCode: 403
        });
      }

      if (!existingPost.isPublished) {
        return reply.status(400).send({ 
          error: 'Validation Error',
          message: 'Post is not published',
          statusCode: 400
        });
      }

      const post = await this.blogPostService.update(id, {
        isPublished: false,
        status: 'DRAFT' as any
      });
      
      logger.info('Blog post unpublished', {
        postId: id,
        postTitle: post.title,
        unpublishedBy: request.user!.id,
        ip: request.ip
      });
      
      return reply.send({
        success: true,
        message: 'Post unpublished successfully',
        data: post,
      });
    } catch (error: any) {
      logger.error('Unpublish post error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to unpublish post',
        statusCode: 500
      });
    }
  }

  // GET /api/posts/:id/analytics (Auth required - Owner/ADMIN)
  async getPostAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if user owns the post or is admin
      const existingPost = await this.blogPostService.getById(id);
      if (!existingPost) {
        return reply.status(404).send({ 
          error: 'Not Found',
          message: 'Post not found',
          statusCode: 404
        });
      }

      if (existingPost.author.id !== request.user!.id && request.user!.role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Forbidden',
          message: 'Not authorized to view analytics for this post',
          statusCode: 403
        });
      }

      // Basic analytics - you can expand this with more detailed analytics
      const analytics = {
        viewCount: existingPost.viewCount,
        commentsCount: existingPost.commentsCount,
        isPublished: existingPost.isPublished,
        publishedAt: existingPost.publishedAt,
        createdAt: existingPost.createdAt,
        updatedAt: existingPost.updatedAt,
        tags: existingPost.tags,
        category: existingPost.category.name,
        // You can add more analytics here like:
        // - Daily/weekly/monthly views
        // - Comment engagement rate
        // - Social shares
        // - Reading time analytics
      };
      
      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error('Get post analytics error:', {
        error: error.message,
        stack: error.stack,
        params: request.params,
        userId: request.user?.id,
        ip: request.ip
      });
      
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch post analytics',
        statusCode: 500
      });
    }
  }
}