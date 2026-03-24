export function withMessage<T>(message: string, key: string, data: T): { message: string } & Record<string, T> {
  return { message, [key]: data } as { message: string } & Record<string, T>;
}

export function withCollection<T>(key: string, data: T): Record<string, T> {
  return { [key]: data };
}
