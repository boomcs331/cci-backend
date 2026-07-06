import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export type ProductSalesReservationStatus =
  | 'ACTIVE'
  | 'RELEASED'
  | 'FULFILLED';

@Entity({ name: 'product_sales_reservations' })
export class ProductSalesReservation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'reference_no', type: 'varchar', length: 100 })
  referenceNo: string;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({
    name: 'reserved_quantity',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  reservedQuantity: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: ProductSalesReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'create_by', type: 'varchar', length: 255, nullable: true })
  createBy: string | null;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
