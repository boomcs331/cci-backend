import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const startTime = Date.now();

    // Log request (hide sensitive data)
    const logBody = { ...body };
    if (logBody.password) {
      logBody.password = '***HIDDEN***';
    }

    this.logger.log(`${method} ${originalUrl} - IP: ${clientIp} - User-Agent: ${userAgent} - Body: ${JSON.stringify(logBody)}`);

    // Log response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const logger = new Logger('AuthMiddleware');
      
      logger.log(`${method} ${originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${clientIp}`);
      
      return originalSend.call(this, data);
    };

    next();
  }
}