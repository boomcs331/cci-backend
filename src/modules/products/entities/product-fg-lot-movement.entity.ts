import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductFgLot } from './product-fg-lot.entity';

@Entity({ name: 'product_fg_lot_movements' })
export class ProductFgLotMovement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'fg_lot_id', type: 'bigint' })
  fgLotId: string;

  @Column({ name: 'step_code', type: 'varchar', length: 40 })
  stepCode: string;

  @Column({ name: 'step_name', type: 'varchar', length: 120 })
  stepName: string;

  @Column({ name: 'movement_type', type: 'varchar', length: 30 })
  movementType: string;

  @Column({
    name: 'quantity_in',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  quantityIn: number | null;

  @Column({
    name: 'quantity_out',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  quantityOut: number | null;

  @Column({ name: 'reference_no', type: 'varchar', length: 100, nullable: true })
  referenceNo: string | null;

  @Column({ name: 'sales_reservation_id', type: 'bigint', nullable: true })
  salesReservationId: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'movement_date', type: 'timestamptz' })
  movementDate: Date;

  @Column({ name: 'create_by', type: 'varchar', length: 255, nullable: true })
  createBy: string | null;

  @ManyToOne(() => ProductFgLot, (lot) => lot.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fg_lot_id' })
  fgLot: ProductFgLot;
}
