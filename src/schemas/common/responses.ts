export const CommonResponses = {
  Success: {
    type: "object",
    properties: {
      success: { type: "boolean", default: true },
      message: { type: "string", example: "Operation completed successfully" },
      data: { 
        type: "object",
        description: "Response data object"
      }
    },
    required: ["success"]
  },

  SuccessWithPagination: {
    type: "object",
    properties: {
      success: { type: "boolean", default: true },
      message: { type: "string", example: "Data retrieved successfully" },
      data: { 
        type: "array",
        description: "Array of items",
        items: { type: "object" }
      },
      pagination: {
        type: "object",
        properties: {
          currentPage: { type: "integer", example: 1 },
          totalPages: { type: "integer", example: 10 },
          totalItems: { type: "integer", example: 95 },
          limit: { type: "integer", example: 10 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false }
        },
        required: ["currentPage", "totalPages", "totalItems", "limit", "hasNext", "hasPrev"]
      }
    },
    required: ["success", "data", "pagination"]
  },

  Error400: {
    type: "object",
    properties: {
      error: { type: "string", default: "Bad Request" },
      message: { type: "string", example: "Invalid request parameters" },
      statusCode: { type: "integer", default: 400 },
      details: { 
        type: "object",
        description: "Additional error details",
        additionalProperties: true
      }
    },
    required: ["error", "message", "statusCode"]
  },

  Error401: {
    type: "object",
    properties: {
      error: { type: "string", default: "Unauthorized" },
      message: { type: "string", example: "Authentication required" },
      statusCode: { type: "integer", default: 401 }
    },
    required: ["error", "message", "statusCode"]
  },

  Error403: {
    type: "object",
    properties: {
      error: { type: "string", default: "Forbidden" },
      message: { type: "string", example: "Insufficient permissions" },
      statusCode: { type: "integer", default: 403 }
    },
    required: ["error", "message", "statusCode"]
  },

  Error404: {
    type: "object",
    properties: {
      error: { type: "string", default: "Not Found" },
      message: { type: "string", example: "Resource not found" },
      statusCode: { type: "integer", default: 404 }
    },
    required: ["error", "message", "statusCode"]
  },

  Error500: {
    type: "object",
    properties: {
      error: { type: "string", default: "Internal Server Error" },
      message: { type: "string", example: "An unexpected error occurred" },
      statusCode: { type: "integer", default: 500 }
    },
    required: ["error", "message", "statusCode"]
  }
};