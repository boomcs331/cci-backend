import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class AuthSanitizeUserInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.removeSensitiveFields(data)));
  }

  private removeSensitiveFields(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.removeSensitiveFields(item));
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      Object.keys(record).forEach((key) => {
        if (key !== 'passwordHash') {
          sanitized[key] = this.removeSensitiveFields(record[key]);
        }
      });

      return sanitized;
    }

    return value;
  }
}
