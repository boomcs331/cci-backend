import { PERMISSION_ACTIONS, type PermissionAction } from './permissions.catalog';

function perm(resource: string, action: PermissionAction): string {
  return `${resource}.${action}`;
}

const CRUD_MANAGE = PERMISSION_ACTIONS;

function crudManage(resource: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const action of CRUD_MANAGE) {
    out[action.toUpperCase()] = perm(resource, action);
  }
  return out;
}

/** Production floor — module `production` */
export const PRODUCTION_ORDER = {
  ...crudManage('production_order'),
} as const;

export const PRODUCTION_STEP = {
  ...crudManage('production_step'),
} as const;

export const PRODUCTION_LOT = {
  ...crudManage('production_lot'),
} as const;

export const PRODUCTION_PRODUCT = {
  ...crudManage('production_product'),
} as const;

export const PRODUCTION_PERMISSIONS = {
  ...PRODUCTION_ORDER,
  ...PRODUCTION_STEP,
  ...PRODUCTION_LOT,
  ...PRODUCTION_PRODUCT,
} as const;

export const PRODUCTION_PERMISSION_CODES = Object.values(PRODUCTION_PERMISSIONS);

/** Stock / FG — module `stock` */
export const PRODUCT_STOCK = {
  ...crudManage('product_stock'),
} as const;

export const SALES_RESERVATION = {
  ...crudManage('sales_reservation'),
} as const;

export const STOCK_PERMISSIONS = {
  ...PRODUCT_STOCK,
  ...SALES_RESERVATION,
  STOCK_OVERVIEW_READ: perm('stock_overview', 'read'),
  STOCK_ALERT_READ: perm('stock_alert', 'read'),
} as const;

export const STOCK_PERMISSION_CODES = Object.values(STOCK_PERMISSIONS);

/** สิทธิ์ใหม่ → legacy API */
export const PRODUCTION_STOCK_IMPLIES_LEGACY: Record<string, readonly string[]> = {
  'production_order.create': ['production_orders.create'],
  'production_order.read': ['production_orders.read'],
  'production_order.update': ['production_orders.update'],
  'production_order.delete': ['production_orders.delete'],
  'production_order.manage': ['production_orders.manage'],

  'production_step.create': ['production_orders.manage'],
  'production_step.read': ['production_orders.read'],
  'production_step.update': ['production_orders.update'],
  'production_step.delete': ['production_orders.manage'],
  'production_step.manage': ['production_orders.manage'],

  'production_lot.create': ['production_orders.create'],
  'production_lot.read': ['production_orders.read'],
  'production_lot.update': ['production_orders.update'],
  'production_lot.delete': ['production_orders.manage'],
  'production_lot.manage': ['production_orders.manage'],

  'production_product.create': ['production_orders.manage'],
  'production_product.read': ['production_orders.read'],
  'production_product.update': ['production_orders.manage'],
  'production_product.delete': ['production_orders.manage'],
  'production_product.manage': ['production_orders.manage'],

  'product_stock.create': ['products.stock.read'],
  'product_stock.read': ['products.stock.read'],
  'product_stock.update': ['products.stock.read'],
  'product_stock.delete': ['products.stock.read'],
  'product_stock.manage': ['products.stock.read'],

  'sales_reservation.create': ['products.sales.reserve'],
  'sales_reservation.read': ['products.sales.reserve'],
  'sales_reservation.update': ['products.sales.reserve'],
  'sales_reservation.delete': ['products.sales.reserve'],
  'sales_reservation.manage': ['products.sales.reserve'],

  'stock_overview.read': ['products.stock.read'],
  'stock_alert.read': ['products.stock.read'],
};

/** legacy → สิทธิ์ใหม่ (เมนู / UI) */
export const LEGACY_IMPLIES_PRODUCTION_STOCK: Record<string, readonly string[]> = {
  'production_orders.read': [
    'production_order.read',
    'production_step.read',
    'production_lot.read',
    'production_product.read',
  ],
  'production_orders.create': ['production_order.create', 'production_lot.create'],
  'production_orders.update': [
    'production_order.update',
    'production_step.update',
    'production_lot.update',
  ],
  'production_orders.delete': ['production_order.delete'],
  'production_orders.manage': [
    'production_order.manage',
    'production_step.manage',
    'production_lot.manage',
    'production_product.manage',
  ],
  'products.stock.read': ['product_stock.read', 'stock_alert.read'],
  'products.sales.reserve': [
    'sales_reservation.create',
    'sales_reservation.read',
    'sales_reservation.update',
    'sales_reservation.delete',
    'sales_reservation.manage',
  ],
};
