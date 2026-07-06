import { PcErrorCode } from '../errors/pc-error.codes';
import { PC_ERROR_MESSAGES } from '../errors/pc-error.messages';
import type { ValidationResult } from './validation-result';

/** Printable ASCII (space … ~) — อนุญาตตัวเลข อังกฤษ และอักขระพิเศษ */
export const PO_NO_PATTERN = /^[\x20-\x7E]+$/;
export const PO_NO_THAI_PATTERN = /[\u0E00-\u0E7F]/;
export const PO_NO_MAX_LENGTH = 50;

export class PoNoValidator {
  static normalize(value: unknown): string {
    if (value == null) return '';
    return String(value).trim();
  }

  static validate(value: unknown): ValidationResult {
    const normalized = PoNoValidator.normalize(value);
    if (!normalized) {
      return {
        valid: false,
        code: PcErrorCode.PC_PO_NO_REQUIRED,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_PO_NO_REQUIRED],
        field: 'poNo',
      };
    }
    if (PO_NO_THAI_PATTERN.test(normalized)) {
      return {
        valid: false,
        code: PcErrorCode.PC_PO_NO_INVALID,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_PO_NO_INVALID],
        field: 'poNo',
      };
    }
    if (!PO_NO_PATTERN.test(normalized)) {
      return {
        valid: false,
        code: PcErrorCode.PC_PO_NO_INVALID,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_PO_NO_INVALID],
        field: 'poNo',
      };
    }
    if (normalized.length > PO_NO_MAX_LENGTH) {
      return {
        valid: false,
        code: PcErrorCode.PC_PO_NO_TOO_LONG,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_PO_NO_TOO_LONG],
        field: 'poNo',
      };
    }
    return { valid: true, value: normalized };
  }

  static isValid(value: unknown): boolean {
    return PoNoValidator.validate(value).valid;
  }
}
