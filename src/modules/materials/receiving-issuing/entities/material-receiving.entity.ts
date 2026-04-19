import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Material } from '../../entities/material.entity';
import { Supplier } from '../../entities/supplier.entity';
import { MaterialReceivingLot } from './material-receiving-lot.entity';

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

  @OneToMany(() => MaterialReceivingLot, (lot) => lot.receiving)
  lots: MaterialReceivingLot[];
}
