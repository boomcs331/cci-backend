import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductionProcess } from '../../production-orders/entities/production-process.entity';

/** ลำดับขั้นตอนผลิตของแต่ละ Product (หลัง BOM) — ชี้ไป master production_processes */
@Entity({ schema: 'master', name: 'product_production_steps' })
@Unique('uq_product_production_steps_product_step', ['productId', 'stepOrder'])
export class ProductProductionStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  /** 1 = ขั้นแรก, 2 = ขั้นถัดไป, … */
  @Column({ name: 'step_order' })
  stepOrder: number;

  @Column({ name: 'process_id' })
  processId: number;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @ManyToOne(() => Product, (p) => p.productionSteps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductionProcess, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'process_id' })
  process: ProductionProcess;
}
