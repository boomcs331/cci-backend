import { HttpException, HttpStatus } from '@nestjs/common';
import { PcErrorCode } from './pc-error.codes';
import { PC_ERROR_MESSAGES } from './pc-error.messages';
import type { BusinessErrorField, BusinessErrorResponse } from './business-error.response';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: PcErrorCode | string,
    message?: string,
    public readonly errors?: BusinessErrorField[],
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    const body: BusinessErrorResponse = {
      success: false,
      code,
      message:
        message ??
        PC_ERROR_MESSAGES[code as PcErrorCode] ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      ...(errors?.length ? { errors } : {}),
      timestamp: new Date().toISOString(),
    };
    super(body, status);
  }

  static fromCode(
    code: PcErrorCode,
    options?: {
      message?: string;
      field?: string;
      status?: HttpStatus;
    },
  ): BusinessException {
    const message = options?.message ?? PC_ERROR_MESSAGES[code];
    const errors = options?.field
      ? [{ field: options.field, code, message }]
      : undefined;
    return new BusinessException(
      code,
      message,
      errors,
      options?.status ?? HttpStatus.BAD_REQUEST,
    );
  }
}
