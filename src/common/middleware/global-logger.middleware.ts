import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class GlobalLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, params, headers } = req;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to request for tracking
    (req as any).requestId = requestId;

    // Log request (hide sensitive data)
    const logBody = this.sanitizeBody(body);
    const logHeaders = this.sanitizeHeaders(headers);

    this.logger.log(`[${requestId}] ${method} ${originalUrl} - IP: ${clientIp} - User-Agent: ${userAgent}`);
    /* this.logger.debug(`[${requestId}] Query: ${JSON.stringify(query)}`);
    this.logger.debug(`[${requestId}] Params: ${JSON.stringify(params)}`);
    this.logger.debug(`[${requestId}] Body: ${JSON.stringify(logBody)}`);
    this.logger.debug(`[${requestId}] Headers: ${JSON.stringify(logHeaders)}`); */

    // Override response methods to log response
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      const duration = Date.now() - startTime;
      const logger = new Logger('HTTP');
      
      logger.log(`[${requestId}] ${method} ${originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - Size: ${Buffer.byteLength(data || '', 'utf8')} bytes`);
      
      if (res.statusCode >= 400) {
        logger.warn(`[${requestId}] Error Response: ${data}`);
      }
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      const duration = Date.now() - startTime;
      const logger = new Logger('HTTP');
      
      const responseSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      logger.log(`[${requestId}] ${method} ${originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - Size: ${responseSize} bytes`);
      
      if (res.statusCode >= 400) {
        logger.warn(`[${requestId}] Error Response: ${JSON.stringify(data)}`);
      } else {
        logger.debug(`[${requestId}] Response: ${JSON.stringify(data)}`);
      }
      
      return originalJson.call(this, data);
    };

    // Handle response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.log(`[${requestId}] Request completed - Duration: ${duration}ms - Status: ${res.statusCode}`);
    });

    // Handle errors
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      this.logger.error(`[${requestId}] Request error - Duration: ${duration}ms - Error: ${error.message}`);
    });

    next();
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
}