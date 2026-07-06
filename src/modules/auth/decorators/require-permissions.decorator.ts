import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const PERMISSION_MATCH_MODE_KEY = 'permission_match_mode';

export type PermissionMatchMode = 'all' | 'any';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

export const PermissionMatch = (mode: PermissionMatchMode) =>
  SetMetadata(PERMISSION_MATCH_MODE_KEY, mode);
