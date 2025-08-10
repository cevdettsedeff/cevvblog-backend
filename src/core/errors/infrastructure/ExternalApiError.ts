import { ErrorCode } from "../../../domain/enums/ErrorCode";
import { BaseError } from "../BaseError";

export class ExternalApiError extends BaseError {
  public readonly service: string;
  public readonly endpoint?: string;
  public readonly responseStatus?: number;

  constructor(
    message: string,
    service: string,
    endpoint?: string,
    responseStatus?: number,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.EXTERNAL_API_ERROR, 502, true, {
      service,
      endpoint,
      responseStatus,
      ...context
    });
    
    this.service = service;
    this.endpoint = endpoint;
    this.responseStatus = responseStatus;
  }

  static serviceUnavailable(service: string, endpoint?: string): ExternalApiError {
    return new ExternalApiError(
      `External service ${service} is unavailable`,
      service,
      endpoint,
      503,
      { type: 'unavailable' }
    );
  }

  static timeout(service: string, endpoint?: string, timeoutMs?: number): ExternalApiError {
    return new ExternalApiError(
      `Request to ${service} timed out`,
      service,
      endpoint,
      408,
      { type: 'timeout', timeoutMs }
    );
  }

  static badResponse(
    service: string, 
    endpoint?: string, 
    status?: number, 
    responseBody?: any
  ): ExternalApiError {
    return new ExternalApiError(
      `Bad response from ${service}`,
      service,
      endpoint,
      status,
      { type: 'bad_response', responseBody }
    );
  }

  static authenticationFailed(service: string, endpoint?: string): ExternalApiError {
    return new ExternalApiError(
      `Authentication failed for ${service}`,
      service,
      endpoint,
      401,
      { type: 'authentication' }
    );
  }

  static rateLimitExceeded(service: string, endpoint?: string, retryAfter?: number): ExternalApiError {
    return new ExternalApiError(
      `Rate limit exceeded for ${service}`,
      service,
      endpoint,
      429,
      { type: 'rate_limit', retryAfter }
    );
  }
}