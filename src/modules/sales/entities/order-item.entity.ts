import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { SalesOrder } from './order.entity';

@Entity({ schema: 'sales', name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitPrice: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discount: string;

  @Column({ name: 'line_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  lineTotal: string;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: SalesOrder;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;
}
