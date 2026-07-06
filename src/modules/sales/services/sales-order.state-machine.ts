import type { SalesOrderStatus } from '../entities';

/** สถานะที่เปลี่ยนได้จากสถานะปัจจุบัน */
export const ORDER_TRANSITIONS: Record<
  SalesOrderStatus,
  readonly SalesOrderStatus[]
> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(
  from: SalesOrderStatus,
  to: SalesOrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** สถานะที่เคยจองสต็อกแล้ว — ยกเลิกต้องคืน reserved */
export function requiresStockRelease(status: SalesOrderStatus): boolean {
  return status === 'APPROVED' || status === 'PROCESSING';
}

export function reservesStockOnEnter(status: SalesOrderStatus): boolean {
  return status === 'APPROVED';
}

export function shipsStockOnEnter(status: SalesOrderStatus): boolean {
  return status === 'SHIPPING';
}
