import { PcErrorCode } from '../errors/pc-error.codes';
import { PC_ERROR_MESSAGES } from '../errors/pc-error.messages';
import type { ValidationResult } from './validation-result';

export class MfgDateValidator {
  static validate(value: unknown): ValidationResult {
    if (value == null || String(value).trim() === '') {
      return {
        valid: false,
        code: PcErrorCode.PC_MFG_DATE_REQUIRED,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_MFG_DATE_REQUIRED],
        field: 'mfgDate',
      };
    }
    const selected = new Date(String(value));
    if (Number.isNaN(selected.getTime())) {
      return {
        valid: false,
        code: PcErrorCode.PC_MFG_DATE_INVALID,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_MFG_DATE_INVALID],
        field: 'mfgDate',
      };
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      return {
        valid: false,
        code: PcErrorCode.PC_MFG_DATE_FUTURE,
        message: PC_ERROR_MESSAGES[PcErrorCode.PC_MFG_DATE_FUTURE],
        field: 'mfgDate',
      };
    }
    return { valid: true, value: String(value) };
  }
}
