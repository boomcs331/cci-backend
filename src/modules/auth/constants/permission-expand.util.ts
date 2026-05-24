import { PC_PERMISSION_IMPLIES_LEGACY } from './permissions.catalog';
import {
  LEGACY_IMPLIES_PRODUCTION_STOCK,
  PRODUCTION_STOCK_IMPLIES_LEGACY,
} from './production-stock-permissions';

export { PC_PERMISSION_IMPLIES_LEGACY } from './permissions.catalog';

/**
 * ไม่ map legacy production_plans.* → pc.* (ทำให้ production-only เห็นเมนู PC)
 * PC → legacy ยังใช้ผ่าน PC_PERMISSION_IMPLIES_LEGACY สำหรับ API เดิม
 */
const NEW_TO_LEGACY: Record<string, readonly string[]> = {
  ...PC_PERMISSION_IMPLIES_LEGACY,
  ...PRODUCTION_STOCK_IMPLIES_LEGACY,
};

const LEGACY_TO_NEW: Record<string, readonly string[]> = {
  ...LEGACY_IMPLIES_PRODUCTION_STOCK,
};

/** รวมสิทธิ์ที่ user ถือ + implied (สองทาง) */
export function expandEffectivePermissions(userCodes: string[]): Set<string> {
  const expanded = new Set(userCodes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const code of [...expanded]) {
      for (const legacy of NEW_TO_LEGACY[code] ?? []) {
        if (!expanded.has(legacy)) {
          expanded.add(legacy);
          changed = true;
        }
      }
      for (const newer of LEGACY_TO_NEW[code] ?? []) {
        if (!expanded.has(newer)) {
          expanded.add(newer);
          changed = true;
        }
      }
    }
  }
  return expanded;
}

export function userSatisfiesPermission(
  userCodes: string[],
  required: string,
): boolean {
  return expandEffectivePermissions(userCodes).has(required);
}
