import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PoNoValidator } from '../po-no.validator';

@ValidatorConstraint({ name: 'isPoNo', async: false })
export class IsPoNoConstraint implements ValidatorConstraintInterface {
  private lastValue: unknown;

  validate(value: unknown): boolean {
    this.lastValue = value;
    return PoNoValidator.validate(value).valid;
  }

  defaultMessage(): string {
    const result = PoNoValidator.validate(this.lastValue);
    if (!result.valid) return result.message;
    return 'Invalid PO number';
  }
}

export function IsPoNo(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPoNoConstraint,
    });
  };
}
