import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ADMIN_GLOBAL_KEY = 'requireAdminGlobal';

/** จำกัดเฉพาะผู้ใช้ที่มีบทบาท ADMIN_GLOBAL */
export const RequireAdminGlobal = () =>
  SetMetadata(REQUIRE_ADMIN_GLOBAL_KEY, true);
