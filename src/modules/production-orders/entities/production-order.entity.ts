import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductionLot } from './production-lot.entity';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', unique: true })
  orderNo: string;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'order_quantity', type: 'decimal', precision: 15, scale: 4 })
  orderQuantity: number;

  @Column({ name: 'lot_size', type: 'decimal', precision: 15, scale: 4 })
  lotSize: number;

  @Column({ name: 'total_lots' })
  totalLots: number;

  @Column({ default: 'DRAFT' })
  status: string; // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by' })
  createBy: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => ProductionLot, lot => lot.order)
  lots: ProductionLot[];
}
