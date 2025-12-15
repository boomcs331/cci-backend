import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiAuditService } from '../services/api-audit.service';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly apiAuditService: ApiAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, originalUrl, body, query, params, headers } = request;
    const clientIp = request.ip || request.connection.remoteAddress || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';
    const requestId = (request as any).requestId || 'unknown';
    const startTime = Date.now();

    // Calculate request size
    const requestSize = Buffer.byteLength(JSON.stringify(body || {}), 'utf8');

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');

        // Log successful request
        this.apiAuditService.logApiRequest({
          timestamp: new Date().toISOString(),
          requestId,
          method,
          url: originalUrl,
          statusCode: response.statusCode,
          duration,
          clientIp,
          userAgent,
          requestSize,
          responseSize,
          query: Object.keys(query || {}).length > 0 ? query : undefined,
          params: Object.keys(params || {}).length > 0 ? params : undefined,
          body: this.sanitizeBody(body),
          headers: this.sanitizeHeaders(headers),
          response: this.shouldLogResponse(originalUrl) ? this.sanitizeResponse(data) : undefined,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const responseSize = Buffer.byteLength(JSON.stringify(error.message || ''), 'utf8');

        // Log error request
        this.apiAuditService.logApiRequest({
          timestamp: new Date().toISOString(),
          requestId,
          method,
          url: originalUrl,
          statusCode: error.status || 500,
          duration,
          clientIp,
          userAgent,
          requestSize,
          responseSize,
          query: Object.keys(query || {}).length > 0 ? query : undefined,
          params: Object.keys(params || {}).length > 0 ? params : undefined,
          body: this.sanitizeBody(body),
          headers: this.sanitizeHeaders(headers),
          error: error.message || 'Unknown error',
        });

        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '***HIDDEN***';
      }
    }

    // Only keep important headers for logging
    const importantHeaders = ['content-type', 'accept', 'user-agent', 'origin', 'referer', 'host'];
    const filtered: any = {};
    
    for (const header of importantHeaders) {
      if (sanitized[header]) {
        filtered[header] = sanitized[header];
      }
    }

    return filtered;
  }

  private sanitizeResponse(response: any): any {
    if (!response || typeof response !== 'object') {
      return response;
    }

    // Don't log large responses or sensitive data
    const sanitized = { ...response };
    
    // Remove sensitive fields from response
    const sensitiveFields = ['passwordHash', 'token', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    }

    // If response is too large, truncate it
    const responseString = JSON.stringify(sanitized);
    if (responseString.length > 1000) {
      return { 
        ...sanitized, 
        _truncated: true, 
        _originalSize: responseString.length 
      };
    }

    return sanitized;
  }

  private shouldLogResponse(url: string): boolean {
    // Don't log response for certain endpoints to avoid large logs
    const skipResponseLogging = [
      '/auth/users', // User lists can be large
      '/files', // File endpoints
      '/uploads', // Upload endpoints
    ];

    return !skipResponseLogging.some(path => url.includes(path));
  }
}