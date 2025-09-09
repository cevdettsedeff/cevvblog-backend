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
          page: { 
            type: "integer", 
            minimum: 1, 
            default: 1,
            description: "Page number"
          },
          limit: { 
            type: "integer", 
            minimum: 1, 
            maximum: 100, 
            default: 50,
            description: "Items per page"
          },
          sortBy: { 
            type: "string", 
            default: "sortOrder",
            description: "Field to sort by"
          },
          sortOrder: { 
            type: "string", 
            enum: ["asc", "desc"], 
            default: "asc",
            description: "Sort direction"
          },
          filters: {
            type: "string",
            description: "JSON string for filtering"
          }
        },
        // Hiçbir field required değil - hepsi optional ve default değerleri var
      },
      response: {
        200: {
          description: "Categories retrieved successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  slug: { type: "string" },
                  description: { type: "string" },
                  color: { type: "string" },
                  icon: { type: "string" },
                  isActive: { type: "boolean" },
                  sortOrder: { type: "number" },
                  postsCount: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" }
                }
              }
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "number" },
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" },
                totalItems: { type: "number" },
                itemsPerPage: { type: "number" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" }
              }
            }
          }
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetActiveCategories: {
    schema: {
      description: "Get active categories for navbar",
      tags: ["Categories"],
      response: {
        200: {
          description: "Active categories retrieved successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  slug: { type: "string" },
                  description: { type: "string" },
                  color: { type: "string" },
                  icon: { type: "string" },
                  isActive: { type: "boolean" },
                  sortOrder: { type: "number" },
                  postsCount: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" }
                }
              }
            },
            meta: {
              type: "object",
              properties: {
                count: { type: "number" },
                fetchedAt: { type: "string" }
              }
            }
          }
        },
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
          id: { type: "string", description: "Category ID" },
        },
        required: ["id"],
      },
      querystring: {
        type: "object",
        properties: {
          page: { 
            type: "integer", 
            minimum: 1, 
            default: 1 
          },
          limit: { 
            type: "integer", 
            minimum: 1, 
            maximum: 50, 
            default: 10 
          },
          sortBy: { 
            type: "string", 
            default: "publishedAt" 
          },
          sortOrder: { 
            type: "string", 
            enum: ["asc", "desc"], 
            default: "desc" 
          }
        }
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
          id: { type: "string", description: "Category ID" },
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
          slug: { type: "string", description: "Category slug" },
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
          name: { 
            type: "string", 
            minLength: 2, 
            maxLength: 50,
            description: "Category name"
          },
          description: { 
            type: "string", 
            maxLength: 200,
            description: "Category description"
          },
          color: { 
            type: "string", 
            pattern: "^#[0-9a-fA-F]{6}$",
            description: "Hex color code"
          },
          icon: { 
            type: "string", 
            maxLength: 50,
            description: "Icon name"
          },
          sortOrder: { 
            type: "integer", 
            minimum: 0,
            description: "Sort order"
          },
          isActive: {
            type: "boolean",
            description: "Is category active"
          }
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
          id: { type: "string", description: "Category ID" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            minLength: 2, 
            maxLength: 50,
            description: "Category name"
          },
          description: { 
            type: "string", 
            maxLength: 200,
            description: "Category description"
          },
          color: { 
            type: "string", 
            pattern: "^#[0-9a-fA-F]{6}$",
            description: "Hex color code"
          },
          icon: { 
            type: "string", 
            maxLength: 50,
            description: "Icon name"
          },
          sortOrder: { 
            type: "integer", 
            minimum: 0,
            description: "Sort order"
          },
          isActive: { 
            type: "boolean",
            description: "Is category active"
          },
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
          id: { type: "string", description: "Category ID" },
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
          id: { type: "string", description: "Category ID" },
        },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          sortOrder: { 
            type: "integer", 
            minimum: 0,
            description: "New sort order"
          },
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
                id: { type: "string", description: "Category ID" },
                sortOrder: { 
                  type: "integer", 
                  minimum: 0,
                  description: "New sort order"
                },
              },
              required: ["id", "sortOrder"],
            },
            minItems: 1,
            maxItems: 50,
            description: "Array of categories to update"
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

  GetPopularCategories: {
    schema: {
      description: "Get popular categories by post count",
      tags: ["Categories"],
      querystring: {
        type: "object",
        properties: {
          limit: { 
            type: "integer", 
            minimum: 1, 
            maximum: 20, 
            default: 10,
            description: "Number of categories to return"
          }
        }
      },
      response: {
        200: {
          description: "Popular categories retrieved successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  slug: { type: "string" },
                  postsCount: { type: "number" },
                  isActive: { type: "boolean" },
                  sortOrder: { type: "number" }
                }
              }
            }
          }
        },
        500: CommonResponses.Error500,
      },
    },
  },

  GetCategoriesCount: {
    schema: {
      description: "Get total categories count statistics",
      tags: ["Categories"],
      response: {
        200: {
          description: "Categories count retrieved successfully",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                total: { type: "number", description: "Total categories" },
                active: { type: "number", description: "Active categories" },
                inactive: { type: "number", description: "Inactive categories" }
              }
            }
          }
        },
        500: CommonResponses.Error500,
      },
    },
  },
};