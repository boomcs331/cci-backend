import { ValidationError } from 'class-validator';
import { PcErrorCode } from '../errors/pc-error.codes';
import type { BusinessErrorField } from '../errors/business-error.response';

export function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): BusinessErrorField[] {
  const fields: BusinessErrorField[] = [];

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        fields.push({
          field,
          code: PcErrorCode.VALIDATION_FAILED,
          message,
        });
      }
    }

    if (error.children?.length) {
      fields.push(...formatValidationErrors(error.children, field));
    }
  }

  return fields;
}
