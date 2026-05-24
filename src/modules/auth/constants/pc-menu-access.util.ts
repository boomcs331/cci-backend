import { PC_PERMISSION_CODES } from './permissions.catalog';

const ASSIGNED_PC = new Set<string>(PC_PERMISSION_CODES);

/** เมนูที่เป็นส่วน PC (ไม่รวมหน้า production ที่ path อยู่ใต้ /pc) */
const PC_ONLY_MENU_CODES = new Set([
  'pc_root',
  'pc_home',
  'pc_income',
  'pc_outcome',
  'pc_reservations',
  'pc_schedule_res',
  'pc_report',
  'pc_stock',
  'pc_overview',
]);

export function isPcOnlyMenu(menuCode: string, path?: string | null): boolean {
  if (PC_ONLY_MENU_CODES.has(menuCode)) {
    return true;
  }
  const p = (path ?? '').trim();
  if (!p.startsWith('/pc/')) {
    return false;
  }
  if (/^\/pc\/production-/i.test(p)) {
    return false;
  }
  return true;
}

/** มีสิทธิ์ pc.* ที่ผูกกับ role โดยตรง (ไม่นับจาก legacy expand) */
export function userHasAssignedPcPermission(assignedCodes: string[]): boolean {
  return assignedCodes.some((code) => ASSIGNED_PC.has(code));
}

export function isPcModuleRoute(pathname: string): boolean {
  if (!pathname.startsWith('/pc')) {
    return false;
  }
  if (/^\/pc\/production-(step-scan|tracking)(\/|$)/.test(pathname)) {
    return false;
  }
  return true;
}
