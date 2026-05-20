import { PcErrorCode } from '../errors/pc-error.codes';

export type ValidationResult =
  | { valid: true; value?: string }
  | { valid: false; code: PcErrorCode; message: string; field?: string };
