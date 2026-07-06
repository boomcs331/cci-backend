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

  /** เลขใบสั่งผลิตอ้างอิง (เก็บซ้ำใน lot เพื่อค้นหา/ตรวจสอบตอน split ได้ตรงจากตารางล็อต) */
  @Column({ name: 'order_no_ref', length: 50, nullable: true })
  orderNoRef?: string;

  @Column({ name: 'qr_code', unique: true })
  qrCode: string;

  @Column({ name: 'sequence_no' })
  sequenceNo: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number;

  /** Parent lot when this lot was created by split; null for original lots. */
  @Column({ name: 'parent_lot_id', nullable: true })
  parentLotId?: number;

  @Column({ name: 'current_process_id', nullable: true })
  currentProcessId?: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, IN_PROGRESS, COMPLETED, REJECTED, SPLIT

  @Column({ name: 'split_reason', type: 'text', nullable: true })
  splitReason?: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionOrder, (order) => order.lots)
  @JoinColumn({ name: 'order_id' })
  order: ProductionOrder;

  @ManyToOne(() => ProductionProcess)
  @JoinColumn({ name: 'current_process_id' })
  currentProcess: ProductionProcess;

  @ManyToOne(() => ProductionLot, (lot) => lot.childLots, { nullable: true })
  @JoinColumn({ name: 'parent_lot_id' })
  parentLot?: ProductionLot;

  @OneToMany(() => ProductionLot, (lot) => lot.parentLot)
  childLots: ProductionLot[];

  @OneToMany(() => ProductionLotTracking, (tracking) => tracking.lot)
  tracking: ProductionLotTracking[];
}
