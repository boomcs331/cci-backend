import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { ProductionProcess } from './production-process.entity';
import { ProductionLotTracking } from './production-lot-tracking.entity';

@Entity('production_lots')
export class ProductionLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  /** เลขล็อตหลักแบบ material: PG{yyyyMMdd}-{run} — QR สร้างจากค่านี้ */
  @Column({ name: 'lot_no', unique: true })
  lotNo: string;

  /** คู่แบบ PD ในรับเข้าวัตถุดิบ — งานผลิตใช้วันที่สร้างใบสั่ง */
  @Column({ name: 'lot_pd_no', length: 50, nullable: true })
  lotPdNo?: string;

  /** อ้างอิงตาม order เดิม เช่น PO2025040001-LOT001 */
  @Column({ name: 'order_lot_label', length: 100, nullable: true })
  orderLotLabel?: string;

  @Column({ name: 'qr_code', unique: true })
  qrCode: string;

  @Column({ name: 'sequence_no' })
  sequenceNo: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  @Column({ name: 'current_process_id', nullable: true })
  currentProcessId?: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, IN_PROGRESS, COMPLETED, REJECTED

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionOrder, (order) => order.lots)
  @JoinColumn({ name: 'order_id' })
  order: ProductionOrder;

  @ManyToOne(() => ProductionProcess)
  @JoinColumn({ name: 'current_process_id' })
  currentProcess: ProductionProcess;

  @OneToMany(() => ProductionLotTracking, (tracking) => tracking.lot)
  tracking: ProductionLotTracking[];
}
