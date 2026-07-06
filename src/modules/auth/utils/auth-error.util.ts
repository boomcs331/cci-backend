import { ConflictException } from '@nestjs/common';

export function throwMappedUniqueConstraintError(
  error: unknown,
  constraintMessageMap: Record<string, string>,
  fallbackMessage = 'Duplicate data detected',
): never {
  const message = error instanceof Error ? error.message : String(error);

  if (!message.includes('duplicate key value violates unique constraint')) {
    throw error;
  }

  const matchedConstraint = Object.keys(constraintMessageMap).find(
    (constraint) => message.includes(constraint),
  );

  if (matchedConstraint) {
    throw new ConflictException(constraintMessageMap[matchedConstraint]);
  }

  throw new ConflictException(fallbackMessage);
}
