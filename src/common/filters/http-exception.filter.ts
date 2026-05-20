import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { BusinessErrorResponse } from '../../shared/errors/business-error.response';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exResponse = exception.getResponse();

    if (
      typeof exResponse === 'object' &&
      exResponse !== null &&
      'success' in exResponse &&
      (exResponse as BusinessErrorResponse).success === false
    ) {
      response.status(status).json(exResponse);
      return;
    }

    const message =
      typeof exResponse === 'string'
        ? exResponse
        : typeof exResponse === 'object' &&
            exResponse !== null &&
            'message' in exResponse
          ? Array.isArray((exResponse as { message: unknown }).message)
            ? ((exResponse as { message: string[] }).message).join(', ')
            : String((exResponse as { message: unknown }).message)
          : 'เกิดข้อผิดพลาด';

    const body: BusinessErrorResponse = {
      success: false,
      code:
        status === HttpStatus.NOT_FOUND
          ? 'NOT_FOUND'
          : status === HttpStatus.CONFLICT
            ? 'CONFLICT'
            : 'HTTP_ERROR',
      message,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
