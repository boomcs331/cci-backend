import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlanningBatch } from './planning-batch.entity';
import { Customer } from '../../products/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';

export enum RowStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  SKIPPED = 'SKIPPED',
}

@Entity({ schema: 'sales', name: 'planning_rows' })
export class PlanningRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id', type: 'int' })
  batchId: number;

  @Column({ name: 'customer_code', length: 50 })
  customerCode: string;

  @Column({ name: 'customer_id', type: 'int', nullable: true })
  customerId: number;

  @Column({ name: 'product_code', length: 50 })
  productCode: string;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ name: 'gate', length: 50, nullable: true, type: 'varchar' })
  gate: string | null;

  @Column({ name: 'location', length: 100, nullable: true, type: 'varchar' })
  location: string | null;

  @Column({ name: 'round', type: 'int', nullable: true })
  round: number | null;

  @Column({ name: 'line', type: 'int', nullable: true })
  line: number | null;

  @Column({ name: 'sale_date', type: 'date' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  quantity: number;

  @Column({ name: 'original_row_number', type: 'int' })
  originalRowNumber: number;

  @Column({
    type: 'enum',
    enum: RowStatus,
    default: RowStatus.VALID,
  })
  status: RowStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PlanningBatch, (batch) => batch.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: PlanningBatch;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
