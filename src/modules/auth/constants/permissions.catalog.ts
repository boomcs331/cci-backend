/**
 * RBAC v2 — single source of truth for permission codes (resource.action).
 * Sync to DB via migration seeds; mirror in cci-frontend/src/constants/permissions.ts
 *
 * @see docs/architecture/RBAC-ACCESS-CONTROL.md
 */

export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'approve',
  'import',
  'export',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** PC module — Phase 1 */
export const PC_RESOURCES = [
  'inbound',
  'outbound',
  'material',
  'production_plan',
  'report',
] as const;

export type PcResource = (typeof PC_RESOURCES)[number];

/** Sales module — Phase 1-3 */
export const SALES_RESOURCES = [
  'sales_order',
  'sales_customer',
  'sales_product',
  'inventory',
] as const;

export type SalesResource = (typeof SALES_RESOURCES)[number];

function perm(resource: string, action: PermissionAction): string {
  return `${resource}.${action}`;
}

export const PC_PERMISSIONS = {
  INBOUND_CREATE: perm('inbound', 'create'),
  INBOUND_READ: perm('inbound', 'read'),
  INBOUND_UPDATE: perm('inbound', 'update'),
  INBOUND_DELETE: perm('inbound', 'delete'),

  OUTBOUND_CREATE: perm('outbound', 'create'),
  OUTBOUND_READ: perm('outbound', 'read'),
  OUTBOUND_UPDATE: perm('outbound', 'update'),
  OUTBOUND_DELETE: perm('outbound', 'delete'),

  MATERIAL_CREATE: perm('material', 'create'),
  MATERIAL_READ: perm('material', 'read'),
  MATERIAL_UPDATE: perm('material', 'update'),
  MATERIAL_DELETE: perm('material', 'delete'),

  PRODUCTION_PLAN_CREATE: perm('production_plan', 'create'),
  PRODUCTION_PLAN_READ: perm('production_plan', 'read'),
  PRODUCTION_PLAN_UPDATE: perm('production_plan', 'update'),
  PRODUCTION_PLAN_DELETE: perm('production_plan', 'delete'),

  REPORT_CREATE: perm('report', 'create'),
  REPORT_READ: perm('report', 'read'),
  REPORT_UPDATE: perm('report', 'update'),
  REPORT_DELETE: perm('report', 'delete'),
} as const;

export type PcPermissionCode =
  (typeof PC_PERMISSIONS)[keyof typeof PC_PERMISSIONS];

/** All PC permissions (for PC_ADMIN seed) */
export const PC_PERMISSION_CODES: PcPermissionCode[] = Object.values(
  PC_PERMISSIONS,
);

export const SALES_PERMISSIONS = {
  SALES_ORDER_CREATE: perm('sales_order', 'create'),
  SALES_ORDER_READ: perm('sales_order', 'read'),
  SALES_ORDER_UPDATE: perm('sales_order', 'update'),
  SALES_ORDER_DELETE: perm('sales_order', 'delete'),
  SALES_ORDER_MANAGE: perm('sales_order', 'manage'),
  SALES_ORDER_APPROVE: perm('sales_order', 'approve'),
  SALES_ORDER_IMPORT: perm('sales_order', 'import'),
  SALES_ORDER_EXPORT: perm('sales_order', 'export'),

  SALES_CUSTOMER_CREATE: perm('sales_customer', 'create'),
  SALES_CUSTOMER_READ: perm('sales_customer', 'read'),
  SALES_CUSTOMER_UPDATE: perm('sales_customer', 'update'),
  SALES_CUSTOMER_DELETE: perm('sales_customer', 'delete'),

  SALES_PRODUCT_CREATE: perm('sales_product', 'create'),
  SALES_PRODUCT_READ: perm('sales_product', 'read'),
  SALES_PRODUCT_UPDATE: perm('sales_product', 'update'),
  SALES_PRODUCT_DELETE: perm('sales_product', 'delete'),

  INVENTORY_READ: perm('inventory', 'read'),
  INVENTORY_UPDATE: perm('inventory', 'update'),
  INVENTORY_MANAGE: perm('inventory', 'manage'),
} as const;

export type SalesPermissionCode =
  (typeof SALES_PERMISSIONS)[keyof typeof SALES_PERMISSIONS];

/** All Sales permissions (for SALES_MANAGER seed) */
export const SALES_PERMISSION_CODES: SalesPermissionCode[] = Object.values(
  SALES_PERMISSIONS,
);

/** สิทธิ์ PC → legacy API */
export const PC_PERMISSION_IMPLIES_LEGACY: Record<string, readonly string[]> = {
  'inbound.create': ['production_plans.create'],
  'inbound.read': ['production_plans.read'],
  'inbound.update': ['production_plans.update'],
  'inbound.delete': ['production_plans.delete'],
  'outbound.create': ['production_plans.issue'],
  'outbound.read': ['production_plans.read'],
  'outbound.update': ['production_plans.update'],
  'outbound.delete': ['production_plans.delete'],
  'material.create': ['production_plans.create'],
  'material.read': ['production_plans.read'],
  'material.update': ['production_plans.update'],
  'material.delete': ['production_plans.delete'],
  'production_plan.create': ['production_plans.create'],
  'production_plan.read': ['production_plans.read'],
  'production_plan.update': ['production_plans.update'],
  'production_plan.delete': ['production_plans.delete'],
  'report.read': ['production_plans.read'],
  'report.create': ['production_plans.create', 'production_plans.manage'],
  'report.update': ['production_plans.update', 'production_plans.manage'],
  'report.delete': ['production_plans.delete', 'production_plans.manage'],
};

/** Role codes — RBAC v2 */
export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  PC_STAFF: 'PC_STAFF',
  PC_ADMIN: 'PC_ADMIN',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

/** PC_STAFF matrix per product spec */
export const PC_STAFF_PERMISSIONS: PcPermissionCode[] = [
  PC_PERMISSIONS.INBOUND_CREATE,
  PC_PERMISSIONS.INBOUND_READ,
  PC_PERMISSIONS.OUTBOUND_CREATE,
  PC_PERMISSIONS.OUTBOUND_READ,
  PC_PERMISSIONS.MATERIAL_READ,
  PC_PERMISSIONS.PRODUCTION_PLAN_CREATE,
  PC_PERMISSIONS.PRODUCTION_PLAN_READ,
  PC_PERMISSIONS.PRODUCTION_PLAN_UPDATE,
  PC_PERMISSIONS.REPORT_READ,
];

/** PC_ADMIN — full CRUD on all PC resources */
export const PC_ADMIN_PERMISSIONS: PcPermissionCode[] = [...PC_PERMISSION_CODES];

/** Menu code → minimum permission to see menu (read-level) */
export const MENU_VISIBILITY_PERMISSIONS: Record<string, string> = {
  pc_income: PC_PERMISSIONS.INBOUND_READ,
  pc_outcome: PC_PERMISSIONS.OUTBOUND_READ,
  pc_home: PC_PERMISSIONS.MATERIAL_READ,
  pc_schedule_res: PC_PERMISSIONS.PRODUCTION_PLAN_READ,
  pc_report: PC_PERMISSIONS.REPORT_READ,
  pc_root: PC_PERMISSIONS.MATERIAL_READ,
  pc_product_stock: 'product_stock.read',
  pc_stock: PC_PERMISSIONS.MATERIAL_READ,
  stock_balance_root: 'product_stock.read',
};
