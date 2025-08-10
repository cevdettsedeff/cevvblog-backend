import { IBaseSchema } from "../../core/interfaces/Common/IBaseSchema";
import { CommonResponses } from "../common/responses";

export const CategoryRoutesSchema: IBaseSchema = {
  GetAllCategories: {
    schema: {
      description: "Get all categories with pagination",
      tags: ["Categories"],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          sortBy: { type: "string", default: "sortOrder" },
          sortOrder: { type: "string", enum: ["asc", "desc"], default: "asc" },
        },
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        500: CommonResponses.Error500,
      },
    },
  },

  GetActiveCategories: {
    schema: {
      description: "Get active categories for navbar",
      tags: ["Categories"],
      response: {
        200: CommonResponses.Success,
        500: CommonResponses.Error500,
      },
    },
  },

  GetCategoryPosts: {
    schema: {
      description: "Get posts by category ID",
      tags: ["Categories"],
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      response: {
        200: CommonResponses.SuccessWithPagination,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetCategoryById: {
    schema: {
      description: "Get category by ID",
      tags: ["Categories"],
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      response: {
        200: CommonResponses.Success,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetCategoryBySlug: {
    schema: {
      description: "Get category by slug",
      tags: ["Categories"],
      params: {
        type: "object",
        properties: {
          slug: { type: "string" },
        },
        required: ["slug"],
      },
      response: {
        200: CommonResponses.Success,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  CreateCategory: {
    schema: {
      description: "Create new category (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50 },
          description: { type: "string", maxLength: 200 },
          color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          icon: { type: "string", maxLength: 50 },
          sortOrder: { type: "integer", minimum: 0 },
        },
        required: ["name"],
      },
      response: {
        201: CommonResponses.Success,
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  UpdateCategory: {
    schema: {
      description: "Update category (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50 },
          description: { type: "string", maxLength: 200 },
          color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          icon: { type: "string", maxLength: 50 },
          sortOrder: { type: "integer", minimum: 0 },
          isActive: { type: "boolean" },
        },
      },
      response: {
        200: CommonResponses.Success,
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  DeleteCategory: {
    schema: {
      description: "Delete category (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      response: {
        200: CommonResponses.Success,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  UpdateSortOrder: {
    schema: {
      description: "Update category sort order (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          sortOrder: { type: "integer", minimum: 0 },
        },
        required: ["sortOrder"],
      },
      response: {
        200: CommonResponses.Success,
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        404: CommonResponses.Error404,
        500: CommonResponses.Error500,
      },
    },
  },

  GetCategoryStats: {
    schema: {
      description: "Get category statistics (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      response: {
        200: CommonResponses.Success,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },

  BulkUpdateSortOrder: {
    schema: {
      description: "Bulk update category sort orders (Admin only)",
      tags: ["Categories", "Admin"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                sortOrder: { type: "integer", minimum: 0 },
              },
              required: ["id", "sortOrder"],
            },
          },
        },
        required: ["categories"],
      },
      response: {
        200: CommonResponses.Success,
        400: CommonResponses.Error400,
        401: CommonResponses.Error401,
        403: CommonResponses.Error403,
        500: CommonResponses.Error500,
      },
    },
  },
};
