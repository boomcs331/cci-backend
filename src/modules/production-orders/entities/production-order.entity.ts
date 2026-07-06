import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductionPlan } from '../../production-plans/entities/production-plan.entity';
import { ProductionPlanItem } from '../../production-plans/entities/production-plan-item.entity';
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

  /**
   * บางฐานข้อมูลมีคอลัมน์ quantity NOT NULL คู่กับ order_quantity — ต้องใส่ค่าเดียวกับ orderQuantity
   */
  @Column({ name: 'quantity', type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ name: 'lot_size', type: 'decimal', precision: 15, scale: 4 })
  lotSize: number;

  @Column({ name: 'total_lots' })
  totalLots: number;

  @Column({ name: 'status', default: 'DRAFT' })
  status: string; // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'plan_id', nullable: true })
  planId?: number;

  @Column({ name: 'plan_item_id', nullable: true })
  planItemId?: number;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by' })
  createBy: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductionPlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan?: ProductionPlan;

  @ManyToOne(() => ProductionPlanItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_item_id' })
  planItem?: ProductionPlanItem;

  @OneToMany(() => ProductionLot, (lot) => lot.order)
  lots: ProductionLot[];
}
