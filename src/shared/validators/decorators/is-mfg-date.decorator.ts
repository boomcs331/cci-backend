import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { MfgDateValidator } from '../mfg-date.validator';

@ValidatorConstraint({ name: 'isMfgDate', async: false })
export class IsMfgDateConstraint implements ValidatorConstraintInterface {
  private lastValue: unknown;

  validate(value: unknown): boolean {
    this.lastValue = value;
    return MfgDateValidator.validate(value).valid;
  }

  defaultMessage(): string {
    const result = MfgDateValidator.validate(this.lastValue);
    if (!result.valid) return result.message;
    return 'Invalid manufacturing date';
  }
}

export function IsMfgDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMfgDateConstraint,
    });
  };
}
