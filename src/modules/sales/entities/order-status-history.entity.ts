import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import type { SalesOrderStatus } from './order.entity';

@Entity({ schema: 'sales', name: 'order_status_history' })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ name: 'from_status', type: 'varchar', length: 20, nullable: true })
  fromStatus: SalesOrderStatus | null;

  @Column({ name: 'to_status', type: 'varchar', length: 20 })
  toStatus: SalesOrderStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'changed_by', type: 'varchar', length: 255, nullable: true })
  changedBy: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;
}
