import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductFgLotMovement } from './product-fg-lot-movement.entity';

@Entity({ name: 'product_fg_lots' })
export class ProductFgLot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'lot_no', type: 'varchar', length: 80, unique: true })
  lotNo: string;

  @Column({ name: 'qr_code', type: 'varchar', length: 120, unique: true })
  qrCode: string;

  @Column({ name: 'production_lot_id', type: 'int', nullable: true })
  productionLotId: number | null;

  @Column({
    name: 'production_order_no',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  productionOrderNo: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({
    name: 'remaining_quantity',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  remainingQuantity: number;

  @Column({ type: 'varchar', length: 50, default: 'PCS' })
  unit: string;

  @Column({ type: 'varchar', length: 20, default: 'AVAILABLE' })
  status: string;

  @Column({ name: 'source_type', type: 'varchar', length: 30, default: 'PRODUCTION' })
  sourceType: string;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @Column({ name: 'create_by', type: 'varchar', length: 255, nullable: true })
  createBy: string | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @OneToMany(() => ProductFgLotMovement, (m) => m.fgLot)
  movements: ProductFgLotMovement[];
}
