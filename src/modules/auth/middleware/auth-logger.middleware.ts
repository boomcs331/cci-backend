import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { ApiLog } from '../../../core/audit/entities';

@Injectable()
export class AuthLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  constructor(
    @InjectRepository(ApiLog)
    private readonly apiLogRepository: Repository<ApiLog>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const requestId = this.getRequestId(req);
    const clientIp = this.getClientIp(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const startTime = Date.now();
    const sanitizedBody = this.sanitizeBody(req.body);
    const query = req.query ?? {};

    this.logger.log(
      JSON.stringify({
        event: 'auth_request_started',
        requestId,
        method,
        originalUrl,
        clientIp,
        userAgent,
        query,
        body: sanitizedBody,
      }),
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level =
        res.statusCode >= 500
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'log';
      const payload = JSON.stringify({
        event: 'auth_request_finished',
        requestId,
        method,
        originalUrl,
        clientIp,
        statusCode: res.statusCode,
        durationMs: duration,
      });

      this.logger[level](payload);
      void this.persistApiLog({
        requestId,
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        duration,
        clientIp,
        userAgent,
        query,
        params: req.params ?? {},
        body: sanitizedBody,
        headers: this.sanitizeHeaders(req.headers as Record<string, unknown>),
        requestSize: this.getPayloadSize(req.body),
        responseSize: this.getPayloadSize(res.getHeader('content-length')),
        isError: res.statusCode >= 400,
        isSlow: duration > 1000,
      });
    });

    next();
  }

  private getRequestId(req: Request): string {
    const headerRequestId = req.get('x-request-id');
    if (headerRequestId) {
      return headerRequestId;
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
      return xForwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      return xForwardedFor[0];
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private sanitizeBody(body: unknown): unknown {
    const sensitiveKeys = new Set([
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'secret',
      'apiKey',
    ]);

    if (Array.isArray(body)) {
      return body.map((item) => this.sanitizeBody(item));
    }

    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      Object.keys(record).forEach((key) => {
        if (sensitiveKeys.has(key)) {
          sanitized[key] = '***HIDDEN***';
        } else {
          sanitized[key] = this.sanitizeBody(record[key]);
        }
      });

      return sanitized;
    }

    return body;
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized = { ...headers };
    if (sanitized.authorization) {
      sanitized.authorization = '***HIDDEN***';
    }
    if (sanitized.cookie) {
      sanitized.cookie = '***HIDDEN***';
    }
    return sanitized;
  }

  private getPayloadSize(payload: unknown): number {
    if (typeof payload === 'number') {
      return payload;
    }
    if (typeof payload === 'string') {
      return Buffer.byteLength(payload, 'utf8');
    }
    if (payload === null || payload === undefined) {
      return 0;
    }
    try {
      return Buffer.byteLength(JSON.stringify(payload), 'utf8');
    } catch {
      return 0;
    }
  }

  private async persistApiLog(data: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    clientIp: string;
    userAgent: string;
    query: unknown;
    params: unknown;
    body: unknown;
    headers: unknown;
    requestSize: number;
    responseSize: number;
    isError: boolean;
    isSlow: boolean;
  }): Promise<void> {
    try {
      const log = this.apiLogRepository.create({
        ...data,
      });
      await this.apiLogRepository.save(log);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to persist auth API log: ${errorMessage}`);
    }
  }
}
