import { IBaseSchema } from "../../core/interfaces/Common/IBaseSchema";
import { CommonResponses } from "../common/responses";

export const UserRoutesSchema: IBaseSchema = {
  Login: {
    schema: {
      summary: "User authentication",
      description: "Authenticate user with email and password, returns JWT tokens",
      tags: ["Authentication"],
      body: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User's email address",
          },
          password: {
            type: "string",
            description: "User's password",
          },
        },
        required: ["email", "password"],
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
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                accessToken: {
                  type: "string",
                  description: "JWT access token",
                },
                refreshToken: {
                  type: "string",
                  description: "JWT refresh token",
                },
              },
            },
          },
        },
        401: {
          type: "object",
          properties: {
            error: { type: "string", default: "Unauthorized" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 401 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  Register: {
    schema: {
      summary: "Register new user account",
      description: "Create a new user account with email, username and password",
      tags: ["Authentication"],
      body: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "Valid email address",
          },
          username: {
            type: "string",
            minLength: 3,
            maxLength: 30,
            pattern: "^[a-zA-Z0-9_]+$",
            description: "Unique username (3-30 characters, alphanumeric and underscore only)",
          },
          firstName: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            description: "User's first name",
          },
          lastName: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            description: "User's last name",
          },
          password: {
            type: "string",
            minLength: 6,
            description: "Password (minimum 6 characters)",
          },
        },
        required: ["email", "username", "firstName", "lastName", "password"],
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
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    username: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string" },
                    avatar: { type: "string" },
                  },
                },
                accessToken: {
                  type: "string",
                  description: "JWT access token",
                },
                refreshToken: {
                  type: "string",
                  description: "JWT refresh token",
                },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        409: {
          type: "object",
          properties: {
            error: { type: "string", default: "Conflict" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 409 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetProfile: {
    schema: {
      summary: "Get current user profile",
      description: "Retrieve the authenticated user's profile information",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
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
                email: { type: "string" },
                username: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                role: { type: "string" },
                avatar: { type: "string" },
                bio: { type: "string" },
                isActive: { type: "boolean" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        401: CommonResponses.Error401,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  UpdateProfile: {
    schema: {
      summary: "Update user profile",
      description: "Update the authenticated user's profile information",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          username: {
            type: "string",
            minLength: 3,
            maxLength: 30,
            description: "New username (optional)",
          },
          firstName: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            description: "Updated first name (optional)",
          },
          lastName: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            description: "Updated last name (optional)",
          },
          bio: {
            type: "string",
            maxLength: 500,
            description: "User bio (optional, max 500 characters)",
          },
          avatar: {
            type: "string",
            format: "uri",
            description: "Avatar image URL (optional)",
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
                email: { type: "string" },
                username: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                role: { type: "string" },
                avatar: { type: "string" },
                bio: { type: "string" },
                isActive: { type: "boolean" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        409: {
          type: "object",
          properties: {
            error: { type: "string", default: "Conflict" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 409 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetAuthors: {
    schema: {
      summary: "Get all blog authors",
      description: "Retrieve list of users who have authored blog posts",
      tags: ["Users"],
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
                  email: { type: "string" },
                  username: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  role: { type: "string" },
                  avatar: { type: "string" },
                  bio: { type: "string" },
                  isActive: { type: "boolean" },
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

  GetUserById: {
    schema: {
      summary: "Get user by ID",
      description: "Retrieve public profile information for a specific user",
      tags: ["Users"],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "User ID",
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
                email: { type: "string" },
                username: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                role: { type: "string" },
                avatar: { type: "string" },
                bio: { type: "string" },
                isActive: { type: "boolean" },
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

  GetAllUsers: {
    schema: {
      summary: "Get all users (Admin)",
      description: "Retrieve paginated list of all users (Admin only)",
      tags: ["Users", "Admin"],
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
            description: "Number of items per page (max 100)",
          },
          sortBy: {
            type: "string",
            default: "createdAt",
            enum: ["createdAt", "email", "firstName", "lastName", "role"],
            description: "Field to sort by",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order",
          },
          role: {
            type: "string",
            enum: ["USER", "ADMIN", "AUTHOR"],
            description: "Filter by user role (optional)",
          },
          search: {
            type: "string",
            description: "Search in email, firstName, lastName, username (optional)",
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

  ChangePassword: {
    schema: {
      summary: "Change user password",
      description: "Change the authenticated user's password",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          currentPassword: {
            type: "string",
            description: "Current password for verification",
          },
          newPassword: {
            type: "string",
            minLength: 6,
            description: "New password (minimum 6 characters)",
          },
          confirmPassword: {
            type: "string",
            description: "Confirm new password (must match newPassword)",
          },
        },
        required: ["currentPassword", "newPassword", "confirmPassword"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
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
        401: {
          type: "object",
          properties: {
            error: { type: "string", default: "Unauthorized" },
            message: { type: "string" },
            statusCode: { type: "integer", default: 401 },
          },
        },
        500: CommonResponses.Error500,
      },
    },
  },

  // Add logout endpoint for completeness
  Logout: {
    schema: {
      summary: "User logout",
      description: "Logout user and invalidate JWT token",
      tags: ["Authentication"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean", default: true },
            message: { type: "string" },
          },
        },
        401: CommonResponses.Error401,
        500: CommonResponses.Error500,
      },
    },
  },

  RefreshToken: {
    schema: {
      summary: "Refresh access token",
      description: "Get new access token using refresh token",
      tags: ["Authentication"],
      body: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description: "Valid refresh token",
          },
        },
        required: ["refreshToken"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
              },
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
        401: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
      },
    },
  },

  GetUserStats: {
    schema: {
      summary: "Get user statistics",
      description: "Get user statistics (own stats or admin access)",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID" },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                totalPosts: { type: "number" },
                totalComments: { type: "number" },
                joinedDaysAgo: { type: "number" },
                lastActivity: { type: "string", format: "date-time" },
              },
            },
          },
        },
        401: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
        403: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
      },
    },
  },

  PromoteToAuthor: {
    schema: {
      summary: "Promote user to author",
      description: "Promote a regular user to author role (Admin only)",
      tags: ["Users", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string", description: "User ID to promote" },
        },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                username: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                role: { type: "string", enum: ["USER", "AUTHOR", "ADMIN"] },
                isActive: { type: "boolean" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
        403: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
        404: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
      },
    },
  },

  DemoteToUser: {
    schema: {
      summary: "Demote author to user",
      description: "Demote an author to regular user role (Admin only)",
      tags: ["Users", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "User ID to demote",
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
                email: { type: "string" },
                username: { type: "string" },
                firstName: { type: "string" },
                lastName: { type: "string" },
                role: {
                  type: "string",
                  enum: ["USER", "AUTHOR", "ADMIN"],
                },
                isActive: { type: "boolean" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
                avatar: { type: "string" },
                bio: { type: "string" },
                postsCount: { type: "number" },
                commentsCount: { type: "number" },
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

  DeactivateUser: {
    schema: {
      summary: "Deactivate user account",
      description: "Deactivate a user account (Admin only)",
      tags: ["Users", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "User ID to deactivate",
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
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  ActivateUser: {
    schema: {
      summary: "Activate user account",
      description: "Activate a deactivated user account (Admin only)",
      tags: ["Users", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "User ID to activate",
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
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },
};
