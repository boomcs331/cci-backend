import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialsLocation } from '../../entities/materials-location.entity';
import { MaterialReceiving } from './material-receiving.entity';

@Entity('material_receiving_lots')
export class MaterialReceivingLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'receiving_id' })
  receivingId: number;

  @Column({ name: 'lot_no', length: 50, unique: true })
  lotNo: string;

  @Column({ name: 'qr_code', length: 100, unique: true })
  qrCode: string;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 15, scale: 2 })
  remainingQuantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ name: 'location_id', nullable: true })
  locationId: number;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'income_supplire_date', type: 'date', nullable: true })
  incomeSupplireDate: Date;

  @Column({ length: 20, default: 'AVAILABLE' })
  status: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @ManyToOne(() => MaterialReceiving, receiving => receiving.lots)
  @JoinColumn({ name: 'receiving_id' })
  receiving: MaterialReceiving;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => MaterialsLocation)
  @JoinColumn({ name: 'location_id' })
  location: MaterialsLocation;
}
