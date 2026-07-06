import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../products/entities/customer.entity';
import { OrderItem } from './order-item.entity';

export type SalesOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export type SalesOrderSource = 'MANUAL' | 'EXCEL';

@Entity({ schema: 'sales', name: 'orders' })
export class SalesOrder {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'order_no', length: 30, unique: true })
  orderNo: string;

  @Column({ name: 'customer_id', type: 'int' })
  customerId: number;

  @Column({ name: 'sales_user_id', type: 'varchar', length: 64, nullable: true })
  salesUserId: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status: SalesOrderStatus;

  @Column({ name: 'sales_channel', type: 'varchar', length: 50, nullable: true })
  salesChannel: string | null;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: string;

  @Column({ name: 'required_date', type: 'date', nullable: true })
  requiredDate: string | null;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: string;

  @Column({
    name: 'discount_total',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  discountTotal: string;

  @Column({
    name: 'grand_total',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  grandTotal: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 20, default: 'MANUAL' })
  source: SalesOrderSource;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @Column({ name: 'create_by', type: 'varchar', length: 255, nullable: true })
  createBy: string | null;

  @UpdateDateColumn({ name: 'update_date', type: 'timestamptz' })
  updateDate: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 255, nullable: true })
  updateBy: string | null;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
