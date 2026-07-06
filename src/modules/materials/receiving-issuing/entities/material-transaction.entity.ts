import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialReceivingLot } from './material-receiving-lot.entity';

@Entity('material_transactions')
export class MaterialTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_no', length: 50, unique: true })
  transactionNo: string;

  @Column({ name: 'transaction_type', length: 20 })
  transactionType: string;

  @Column({ name: 'transaction_date', type: 'timestamp' })
  transactionDate: Date;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'lot_id', nullable: true })
  lotId: number;

  @Column({ name: 'qr_code', length: 100, nullable: true })
  qrCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({
    name: 'remaining_quantity',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  remainingQuantity: number;

  @Column({ name: 'reference_no', length: 50, nullable: true })
  referenceNo: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => MaterialReceivingLot)
  @JoinColumn({ name: 'lot_id' })
  lot: MaterialReceivingLot;
}
