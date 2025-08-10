import { IBaseSchema } from "../../core/interfaces/Common/IBaseSchema";
import { CommonResponses } from "../common/responses";

export const CommentRoutesSchema: IBaseSchema = {
  GetCommentsByPost: {
    schema: {
      summary: "Get comments for a blog post",
      description: "Retrieve paginated list of comments for a specific blog post with optional filtering",
      tags: ["Comments"],
      params: {
        type: "object",
        properties: {
          blogPostId: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["blogPostId"],
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
            default: 20,
            description: "Number of comments per page (max 50)",
          },
          sortBy: {
            type: "string",
            default: "createdAt",
            enum: ["createdAt", "updatedAt"],
            description: "Field to sort comments by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "asc",
            description: "Sort order (asc for oldest first, desc for newest first)",
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED"],
            description: "Filter comments by status (defaults to APPROVED for public, all for admins)",
          },
          includeReplies: {
            type: "boolean",
            default: true,
            description: "Include nested replies in response",
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
                  content: { type: "string" },
                  status: { type: "string" },
                  isApproved: { type: "boolean" },
                  blogPostId: { type: "string" },
                  parentId: { type: "string" },
                  author: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      username: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      avatar: { type: "string" },
                    },
                  },
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
        404: {
          type: "object",
          properties: {
            error: { type: "string", default: "Not Found" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 404 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetCommentById: {
    schema: {
      summary: "Get comment by ID",
      description: "Retrieve a specific comment by its unique identifier",
      tags: ["Comments"],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Comment ID",
          },
        },
        required: ["id"],
      },
      querystring: {
        type: "object",
        properties: {
          includeReplies: {
            type: "boolean",
            default: true,
            description: "Include nested replies in response",
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
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
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

  CreateComment: {
    schema: {
      summary: "Create new comment",
      description: "Create a new comment on a blog post (Authentication required)",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          content: {
            type: "string",
            minLength: 10,
            maxLength: 1000,
            description: "Comment content (10-1000 characters)",
          },
          blogPostId: {
            type: "string",
            description: "ID of the blog post to comment on",
          },
          parentId: {
            type: "string",
            description: "ID of parent comment for replies (optional)",
          },
        },
        required: ["content", "blogPostId"],
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
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        404: {
          type: "object",
          properties: {
            error: { type: "string", default: "Not Found" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 404 },
          },
        },
        429: {
          type: "object",
          properties: {
            error: { type: "string", default: "Too Many Requests" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 429 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  CreateCommentWithSpamDetection: {
    schema: {
      summary: "Create comment with advanced spam detection",
      description: "Create a new comment with enhanced spam detection and content filtering (Authentication required)",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          content: {
            type: "string",
            minLength: 10,
            maxLength: 1000,
            description: "Comment content (10-1000 characters)",
          },
          blogPostId: {
            type: "string",
            description: "ID of the blog post to comment on",
          },
          parentId: {
            type: "string",
            description: "ID of parent comment for replies (optional)",
          },
        },
        required: ["content", "blogPostId"],
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
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                spamScore: { type: "number", description: "Spam probability score (0-1)" },
                autoApproved: { type: "boolean", description: "Whether comment was auto-approved" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        404: CommonResponses.Error404,
        422: {
          type: "object",
          properties: {
            error: { type: "string", default: "Unprocessable Entity" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 422 },
            details: {
              type: "object",
              properties: {
                spamScore: { type: "number" },
                reasons: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  UpdateComment: {
    schema: {
      summary: "Update comment",
      description: "Update a comment (Comment owner or Admin only)",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Comment ID to update",
          },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          content: {
            type: "string",
            minLength: 10,
            maxLength: 1000,
            description: "Updated comment content (optional for users, required if updating content)",
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED"],
            description: "Comment status (Admin only)",
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
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: {
          type: "object",
          properties: {
            error: { type: "string", default: "Forbidden" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 403 },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  DeleteComment: {
    schema: {
      summary: "Delete comment",
      description: "Delete a comment (Comment owner or Admin only). Replies will also be deleted.",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Comment ID to delete",
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
                deletedCommentId: { type: "string" },
                deletedRepliesCount: { type: "integer" },
              },
            },
          },
        },
        401: CommonResponses.Error401,
        403: {
          type: "object",
          properties: {
            error: { type: "string", default: "Forbidden" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 403 },
          },
        },
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetRecentComments: {
    schema: {
      summary: "Get recent comments",
      description: "Retrieve most recently posted approved comments across all posts",
      tags: ["Comments"],
      querystring: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 10,
            description: "Number of comments to return (max 50)",
          },
          excludeReplies: {
            type: "boolean",
            default: false,
            description: "Exclude comment replies, only show top-level comments",
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
                  content: { type: "string" },
                  status: { type: "string" },
                  isApproved: { type: "boolean" },
                  blogPostId: { type: "string" },
                  parentId: { type: "string" },
                  author: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      username: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      avatar: { type: "string" },
                    },
                  },
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

  GetCommentsByDateRange: {
    schema: {
      summary: "Get comments by date range",
      description: "Retrieve comments within a specific date range (Admin only)",
      tags: ["Comments", "Admin"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date (YYYY-MM-DD)",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date (YYYY-MM-DD)",
          },
          page: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "ALL"],
            default: "ALL",
          },
        },
        required: ["startDate", "endDate"],
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  GetTopCommentedPosts: {
    schema: {
      summary: "Get most commented blog posts",
      description: "Retrieve blog posts with the highest number of comments",
      tags: ["Comments", "Analytics"],
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
          period: {
            type: "string",
            enum: ["week", "month", "quarter", "year", "all"],
            default: "all",
            description: "Time period for comment count",
          },
          minComments: {
            type: "integer",
            minimum: 1,
            default: 1,
            description: "Minimum number of comments required",
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
                  post: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      slug: { type: "string" },
                      excerpt: { type: "string" },
                      featuredImage: { type: "string" },
                      publishedAt: { type: "string" },
                    },
                  },
                  commentCount: { type: "integer" },
                  approvedCommentCount: { type: "integer" },
                  replyCount: { type: "integer" },
                  lastCommentAt: { type: "string", format: "date-time" },
                  averageRating: { type: "number", nullable: true },
                },
              },
            },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  CountCommentsByBlogPost: {
    schema: {
      summary: "Count comments for a blog post",
      description: "Get total count of approved comments for a specific blog post",
      tags: ["Comments"],
      params: {
        type: "object",
        properties: {
          blogPostId: {
            type: "string",
            description: "Blog post ID",
          },
        },
        required: ["blogPostId"],
      },
      querystring: {
        type: "object",
        properties: {
          includeReplies: {
            type: "boolean",
            default: true,
            description: "Include replies in count",
          },
          status: {
            type: "string",
            enum: ["APPROVED", "ALL"],
            default: "APPROVED",
            description: "Count comments by status",
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
              type: "object",
              properties: {
                blogPostId: { type: "string" },
                totalComments: { type: "integer" },
                approvedComments: { type: "integer" },
                pendingComments: { type: "integer" },
                totalReplies: { type: "integer" },
                lastCommentAt: { type: "string", format: "date-time", nullable: true },
              },
            },
          },
        },
        404: {
          type: "object",
          properties: {
            error: { type: "string", default: "Not Found" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 404 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetCommentsByAuthor: {
    schema: {
      summary: "Get comments by author",
      description: "Retrieve comments posted by a specific user (Admin or own comments only)",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          authorId: {
            type: "string",
            description: "Author/User ID",
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
            default: 20,
            description: "Number of comments per page (max 50)",
          },
          sortBy: {
            type: "string",
            default: "createdAt",
            enum: ["createdAt", "updatedAt"],
            description: "Field to sort comments by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order",
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "ALL"],
            description: "Filter by comment status (Admin can see all, users see only their own)",
          },
        },
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        401: CommonResponses.Error401,
        403: {
          type: "object",
          properties: {
            error: { type: "string", default: "Forbidden" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 403 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetPendingComments: {
    schema: {
      summary: "Get pending comments for moderation",
      description: "Retrieve all comments awaiting moderation approval (Admin only)",
      tags: ["Comments", "Moderation"],
      security: [{ bearerAuth: [] }],
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
            maximum: 100,
            default: 20,
            description: "Number of comments per page (max 100)",
          },
          sortBy: {
            type: "string",
            default: "createdAt",
            enum: ["createdAt", "updatedAt"],
            description: "Field to sort comments by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "asc",
            description: "Sort order (asc for oldest first)",
          },
          blogPostId: {
            type: "string",
            description: "Filter by specific blog post (optional)",
          },
        },
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  ApproveComment: {
    schema: {
      summary: "Approve comment",
      description: "Approve a pending comment for public display (Admin only)",
      tags: ["Comments", "Moderation"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Comment ID to approve",
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
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string", default: "Bad Request" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 400 },
          },
        },
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  BulkRejectComments: {
    schema: {
      summary: "Bulk reject comments",
      description: "Reject multiple comments at once (Admin only)",
      tags: ["Comments", "Moderation"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          commentIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 50,
            description: "Array of comment IDs to reject (max 50)",
          },
          reason: {
            type: "string",
            maxLength: 200,
            description: "Reason for rejection (applied to all)",
          },
        },
        required: ["commentIds"],
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
                rejectedCount: { type: "integer" },
                failedCount: { type: "integer" },
                failed: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      commentId: { type: "string" },
                      reason: { type: "string" },
                    },
                  },
                },
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

  GetCommentStats: {
    schema: {
      summary: "Get comment statistics",
      description: "Retrieve statistics about comments (Admin only)",
      tags: ["Comments", "Analytics", "Admin"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["day", "week", "month", "year"],
            default: "month",
            description: "Time period for statistics",
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
              type: "object",
              properties: {
                totalComments: { type: "integer" },
                approvedComments: { type: "integer" },
                pendingComments: { type: "integer" },
                rejectedComments: { type: "integer" },
                totalReplies: { type: "integer" },
                commentsPerDay: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      count: { type: "integer" },
                    },
                  },
                },
                topCommenters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      authorId: { type: "string" },
                      username: { type: "string" },
                      count: { type: "integer" },
                    },
                  },
                },
                avgResponseTime: { type: "number", description: "Average response time in hours" },
              },
            },
          },
        },
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  RejectComment: {
    schema: {
      summary: "Reject comment",
      description: "Reject a comment and hide it from public display (Admin only)",
      tags: ["Comments", "Moderation"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Comment ID to reject",
          },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            maxLength: 200,
            description: "Reason for rejection (optional)",
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
                content: { type: "string" },
                status: { type: "string" },
                isApproved: { type: "boolean" },
                blogPostId: { type: "string" },
                parentId: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string", default: "Bad Request" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 400 },
          },
        },
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  BulkApproveComments: {
    schema: {
      summary: "Bulk approve comments",
      description: "Approve multiple comments at once (Admin only)",
      tags: ["Comments", "Moderation"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          commentIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 50,
            description: "Array of comment IDs to approve (max 50)",
          },
        },
        required: ["commentIds"],
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
                approvedCount: { type: "integer" },
                failedCount: { type: "integer" },
                approvedComments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      content: { type: "string" },
                      status: { type: "string" },
                      isApproved: { type: "boolean" },
                      blogPostId: { type: "string" },
                      parentId: { type: "string" },
                      author: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          username: { type: "string" },
                          firstName: { type: "string" },
                          lastName: { type: "string" },
                          avatar: { type: "string" },
                        },
                      },
                      createdAt: { type: "string" },
                      updatedAt: { type: "string" },
                    },
                  },
                },
                failed: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      commentId: { type: "string" },
                      reason: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
