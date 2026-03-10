import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { ProductionProcess } from './production-process.entity';
import { ProductionLotTracking } from './production-lot-tracking.entity';

@Entity('production_lots')
export class ProductionLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'lot_no', unique: true })
  lotNo: string;

  @Column({ name: 'qr_code', unique: true })
  qrCode: string;

  @Column({ name: 'sequence_no' })
  sequenceNo: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ name: 'current_process_id', nullable: true })
  currentProcessId: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, IN_PROGRESS, COMPLETED, REJECTED

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionOrder, order => order.lots)
  @JoinColumn({ name: 'order_id' })
  order: ProductionOrder;

  @ManyToOne(() => ProductionProcess)
  @JoinColumn({ name: 'current_process_id' })
  currentProcess: ProductionProcess;

  @OneToMany(() => ProductionLotTracking, tracking => tracking.lot)
  tracking: ProductionLotTracking[];
}
