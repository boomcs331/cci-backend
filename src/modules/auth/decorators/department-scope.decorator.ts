import { SetMetadata } from '@nestjs/common';

export const DEPARTMENT_SCOPE_KEY = 'department_scope';

export type DepartmentScopeSource = 'params' | 'query' | 'body' | 'headers';

export interface DepartmentScopeOptions {
  source: DepartmentScopeSource;
  key: string;
}

export const DepartmentScope = (options: DepartmentScopeOptions) =>
  SetMetadata(DEPARTMENT_SCOPE_KEY, options);
