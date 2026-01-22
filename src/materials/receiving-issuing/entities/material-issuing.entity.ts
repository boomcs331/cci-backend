import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Material } from '../../entities/material.entity';
import { MaterialIssuingLot } from './material-issuing-lot.entity';

@Entity('material_issuing')
export class MaterialIssuing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuing_no', length: 50, unique: true })
  issuingNo: string;

  @Column({ name: 'issuing_date', type: 'timestamp' })
  issuingDate: Date;

  @Column({ name: 'issuing_type', length: 50, default: 'NORMAL_PRODUCTION' })
  issuingType: string;

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

  @Column({ name: 'machine_no', length: 50, nullable: true })
  machineNo: string;

  @Column({ name: 'part_no', length: 50, nullable: true })
  partNo: string;

  @Column({ name: 'requester', length: 100, nullable: true })
  requester: string;

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
