import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionLot } from './production-lot.entity';
import { ProductionProcess } from './production-process.entity';

@Entity('production_lot_tracking')
export class ProductionLotTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lot_id' })
  lotId: number;

  @Column({ name: 'process_id' })
  processId: number;

  @Column({ name: 'start_time', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column()
  status: string; // IN_PROGRESS, COMPLETED, REJECTED

  @Column({ nullable: true })
  operator: string;

  /** จำนวนรับเข้าขั้นตอนนี้ */
  @Column({
    name: 'quantity_in',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  quantityIn?: number | null;

  /** จำนวนจ่ายออกจากขั้นตอนนี้ */
  @Column({
    name: 'quantity_out',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  quantityOut?: number | null;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionLot, (lot) => lot.tracking)
  @JoinColumn({ name: 'lot_id' })
  lot: ProductionLot;

  @ManyToOne(() => ProductionProcess)
  @JoinColumn({ name: 'process_id' })
  process: ProductionProcess;
}
