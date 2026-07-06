import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ImportBatch } from './import-batch.entity';
import { SalesOrder } from './order.entity';

export type ImportRowStatus = 'PENDING' | 'VALID' | 'ERROR' | 'COMMITTED';

@Entity({ schema: 'sales', name: 'import_rows' })
export class ImportRow {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'batch_id', type: 'bigint' })
  batchId: string;

  @Column({ name: 'row_number', type: 'int' })
  rowNumber: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: ImportRowStatus;

  // Excel data
  @Column({ name: 'order_group', type: 'varchar', length: 50, nullable: true })
  orderGroup: string | null;

  @Column({ name: 'customer_code', type: 'varchar', length: 50, nullable: true })
  customerCode: string | null;

  @Column({ name: 'product_code', type: 'varchar', length: 50, nullable: true })
  productCode: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 4, nullable: true })
  quantity: string | null;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 4, nullable: true })
  unitPrice: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 4, nullable: true })
  discount: string | null;

  @Column({ name: 'required_date', type: 'date', nullable: true })
  requiredDate: Date | null;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: Date | null;

  @Column({ name: 'sales_channel', type: 'varchar', length: 50, nullable: true })
  salesChannel: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  // Validation results
  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  // Reference to created order
  @Column({ name: 'order_id', type: 'bigint', nullable: true })
  orderId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ImportBatch, (batch) => batch.rows)
  @JoinColumn({ name: 'batch_id' })
  batch: ImportBatch;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder | null;
}
