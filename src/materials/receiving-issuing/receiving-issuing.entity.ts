import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Material } from '../entities/material.entity';
import { Supplier } from '../entities/supplier.entity';
import { MaterialsLocation } from '../entities/materials-location.entity';

@Entity('material_receiving')
export class MaterialReceiving {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'receiving_no', length: 50, unique: true })
  receivingNo: string;

  @Column({ name: 'receiving_date', type: 'timestamp' })
  receivingDate: Date;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'total_quantity', type: 'decimal', precision: 15, scale: 2 })
  totalQuantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ name: 'po_no', length: 50, nullable: true })
  poNo: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToMany(() => MaterialReceivingLot, lot => lot.receiving)
  lots: MaterialReceivingLot[];
}

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

@Entity('material_issuing')
export class MaterialIssuing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuing_no', length: 50, unique: true })
  issuingNo: string;

  @Column({ name: 'issuing_date', type: 'timestamp' })
  issuingDate: Date;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'total_quantity', type: 'decimal', precision: 15, scale: 2 })
  totalQuantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ name: 'work_order_no', length: 50, nullable: true })
  workOrderNo: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ length: 20, default: 'COMPLETED' })
  status: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @OneToMany(() => MaterialIssuingLot, lot => lot.issuing)
  lots: MaterialIssuingLot[];
}

@Entity('material_issuing_lots')
export class MaterialIssuingLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuing_id' })
  issuingId: number;

  @Column({ name: 'lot_id' })
  lotId: number;

  @Column({ name: 'qr_code', length: 100 })
  qrCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => MaterialIssuing, issuing => issuing.lots)
  @JoinColumn({ name: 'issuing_id' })
  issuing: MaterialIssuing;

  @ManyToOne(() => MaterialReceivingLot)
  @JoinColumn({ name: 'lot_id' })
  lot: MaterialReceivingLot;
}

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

  @Column({ name: 'remaining_quantity', type: 'decimal', precision: 15, scale: 2, nullable: true })
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
