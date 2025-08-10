import { IBaseSchema } from "../../core/interfaces/Common/IBaseSchema";
import { CommonResponses } from "../common/responses";

export const BlogPostRoutesSchema: IBaseSchema = {
  GetAllPosts: {
    schema: {
      summary: "Get all published blog posts",
      description: "Retrieve paginated list of all published blog posts with optional filtering",
      tags: ["Blog Posts"],
      querystring: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Page number for pagination",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of posts per page (max 50)",
          },
          sortBy: {
            type: "string",
            default: "publishedAt",
            enum: ["publishedAt", "title", "viewCount", "likeCount", "createdAt"],
            description: "Field to sort by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order",
          },
          category: {
            type: "string",
            description: "Filter by category slug (optional)",
          },
          author: {
            type: "string",
            description: "Filter by author username (optional)",
          },
          tags: {
            type: "string",
            description: "Filter by tags (comma-separated, optional)",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  featuredImage: { type: "string" },
                  status: { type: "string" },
                  isPublished: { type: "boolean" },
                  publishedAt: { type: "string" },
                  viewCount: { type: "integer" },
                  likeCount: { type: "integer" },
                  commentCount: { type: "integer" },
                  tags: { type: "array", items: { type: "string" } },
                  readingTime: { type: "integer" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer" },
                totalPages: { type: "integer" },
                totalItems: { type: "integer" },
                limit: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetPostById: {
    schema: {
      summary: "Get blog post by ID",
      description: "Retrieve a specific blog post by its unique identifier",
      tags: ["Blog Posts"],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetPostBySlug: {
    schema: {
      summary: "Get blog post by slug",
      description: "Retrieve a specific blog post by its SEO-friendly slug",
      tags: ["Blog Posts"],
      params: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "Blog post slug",
          },
        },
        required: ["slug"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  SearchPosts: {
    schema: {
      summary: "Search blog posts",
      description: "Search blog posts by title, content, and tags",
      tags: ["Blog Posts"],
      querystring: {
        type: "object",
        properties: {
          q: {
            type: "string",
            minLength: 1,
            description: "Search query",
          },
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
          },
          category: {
            type: "string",
            description: "Filter search results by category (optional)",
          },
        },
        required: ["q"],
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        400: CommonResponses.Error400,
        500: CommonResponses.Error500,
      },
    },
  },

  CreatePost: {
    schema: {
      summary: "Create new blog post",
      description: "Create a new blog post (Author/Admin only)",
      tags: ["Blog Posts", "Content Management"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 5,
            maxLength: 200,
            description: "Post title (5-200 characters)",
          },
          content: {
            type: "string",
            minLength: 50,
            description: "Post content (minimum 50 characters)",
          },
          excerpt: {
            type: "string",
            maxLength: 500,
            description: "Short description of the post (optional, max 500 characters)",
          },
          categoryId: {
            type: "string",
            description: "Category ID for the post",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            maxItems: 10,
            description: "Post tags (max 10 tags)",
          },
          featuredImage: {
            type: "string",
            format: "uri",
            description: "Featured image URL (optional)",
          },
          status: {
            type: "string",
            enum: ["DRAFT", "PUBLISHED"],
            description: "Post status",
          },
          isPublished: {
            type: "boolean",
            description: "Whether the post is published",
          },
          publishedAt: {
            type: "string",
            format: "date-time",
            description: "Scheduled publish date (optional)",
          },
        },
        required: ["title", "content", "categoryId"],
        additionalProperties: false,
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  UpdatePost: {
    schema: {
      summary: "Update blog post",
      description: "Update an existing blog post (Owner/Admin only)",
      tags: ["Blog Posts", "Content Management"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 5,
            maxLength: 200,
            description: "Updated post title (optional)",
          },
          content: {
            type: "string",
            minLength: 50,
            description: "Updated post content (optional)",
          },
          excerpt: {
            type: "string",
            maxLength: 500,
            description: "Updated excerpt (optional)",
          },
          categoryId: {
            type: "string",
            description: "Updated category ID (optional)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            maxItems: 10,
            description: "Updated tags (optional)",
          },
          featuredImage: {
            type: "string",
            format: "uri",
            description: "Updated featured image URL (optional)",
          },
          status: {
            type: "string",
            enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
            description: "Updated post status (optional)",
          },
          isPublished: {
            type: "boolean",
            description: "Updated publish status (optional)",
          },
        },
        additionalProperties: false,
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  DeletePost: {
    schema: {
      summary: "Delete blog post",
      description: "Permanently delete a blog post (Owner/Admin only)",
      tags: ["Blog Posts", "Content Management"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID to delete",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
          },
        },
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetPopularPosts: {
    schema: {
      summary: "Get popular blog posts",
      description: "Retrieve most popular blog posts based on view count",
      tags: ["Blog Posts"],
      querystring: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of posts to return (max 50)",
          },
          timeframe: {
            type: "string",
            enum: ["week", "month", "quarter", "year", "all"],
            default: "month",
            description: "Time period for popularity calculation",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  featuredImage: { type: "string" },
                  status: { type: "string" },
                  isPublished: { type: "boolean" },
                  publishedAt: { type: "string" },
                  viewCount: { type: "integer" },
                  likeCount: { type: "integer" },
                  commentCount: { type: "integer" },
                  tags: { type: "array", items: { type: "string" } },
                  readingTime: { type: "integer" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetRecentPosts: {
    schema: {
      summary: "Get recent blog posts",
      description: "Retrieve most recently published blog posts",
      tags: ["Blog Posts"],
      querystring: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of posts to return (max 50)",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  featuredImage: { type: "string" },
                  status: { type: "string" },
                  isPublished: { type: "boolean" },
                  publishedAt: { type: "string" },
                  viewCount: { type: "integer" },
                  likeCount: { type: "integer" },
                  commentCount: { type: "integer" },
                  tags: { type: "array", items: { type: "string" } },
                  readingTime: { type: "integer" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  PublishPost: {
    schema: {
      summary: "Publish blog post",
      description: "Publish a draft blog post (Owner/Admin only)",
      tags: ["Blog Posts", "Content Management"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID to publish",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  UnpublishPost: {
    schema: {
      summary: "Unpublish blog post",
      description: "Unpublish a published blog post (Owner/Admin only)",
      tags: ["Blog Posts", "Content Management"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID to unpublish",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                featuredImage: { type: "string" },
                status: { type: "string" },
                isPublished: { type: "boolean" },
                publishedAt: { type: "string" },
                viewCount: { type: "integer" },
                likeCount: { type: "integer" },
                commentCount: { type: "integer" },
                tags: { type: "array", items: { type: "string" } },
                readingTime: { type: "integer" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  UploadImage: {
    schema: {
      summary: "Upload image for blog post",
      description: "Upload and attach an image to a blog post (Owner/Admin only)",
      tags: ["Blog Posts", "File Upload"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                imageUrl: {
                  type: "string",
                  format: "uri",
                  description: "URL of the uploaded image",
                },
                imageId: {
                  type: "string",
                  description: "Unique identifier for the uploaded image",
                },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        413: {
          type: "object",
          properties: {
            error: { type: "string", default: "Payload Too Large" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 413 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetPostsByCategory: {
    schema: {
      summary: "Get blog posts by category",
      description: "Retrieve paginated list of blog posts for a specific category",
      tags: ["Blog Posts"],
      params: {
        type: "object",
        properties: {
          categorySlug: {
            type: "string",
            description: "Category slug",
          },
        },
        required: ["categorySlug"],
      },
      querystring: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Page number for pagination",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of posts per page (max 50)",
          },
          sortBy: {
            type: "string",
            default: "publishedAt",
            enum: ["publishedAt", "title", "viewCount", "likeCount", "createdAt"],
            description: "Field to sort by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  featuredImage: { type: "string" },
                  status: { type: "string" },
                  isPublished: { type: "boolean" },
                  publishedAt: { type: "string" },
                  viewCount: { type: "integer" },
                  likeCount: { type: "integer" },
                  commentCount: { type: "integer" },
                  tags: { type: "array", items: { type: "string" } },
                  readingTime: { type: "integer" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer" },
                totalPages: { type: "integer" },
                totalItems: { type: "integer" },
                limit: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetPostsByAuthor: {
    schema: {
      summary: "Get blog posts by author",
      description: "Retrieve paginated list of blog posts by a specific author",
      tags: ["Blog Posts"],
      params: {
        type: "object",
        properties: {
          authorId: {
            type: "string",
            description: "Author ID",
          },
        },
        required: ["authorId"],
      },
      querystring: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Page number for pagination",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of posts per page (max 50)",
          },
          sortBy: {
            type: "string",
            default: "publishedAt",
            enum: ["publishedAt", "title", "viewCount", "likeCount", "createdAt"],
            description: "Field to sort by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order",
          },
          status: {
            type: "string",
            enum: ["PUBLISHED", "DRAFT", "ARCHIVED"],
            default: "PUBLISHED",
            description: "Filter posts by status",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  slug: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  featuredImage: { type: "string" },
                  status: { type: "string" },
                  isPublished: { type: "boolean" },
                  publishedAt: { type: "string" },
                  viewCount: { type: "integer" },
                  likeCount: { type: "integer" },
                  commentCount: { type: "integer" },
                  tags: { type: "array", items: { type: "string" } },
                  readingTime: { type: "integer" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer" },
                totalPages: { type: "integer" },
                totalItems: { type: "integer" },
                limit: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  UploadMultipleImages: {
    schema: {
      summary: "Upload multiple images for blog post",
      description: "Upload multiple images for a blog post (Owner/Admin only)",
      tags: ["Blog Posts", "File Upload"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                imageUrls: {
                  type: "array",
                  items: { type: "string", format: "uri" },
                  description: "Array of uploaded image URLs",
                },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        413: {
          type: "object",
          properties: {
            error: { type: "string", default: "Payload Too Large" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 413 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },
};
