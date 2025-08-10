export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path: string;
  requestId?: string;
}