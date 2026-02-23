import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionPlan } from './production-plan.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('material_reservations')
export class MaterialReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'reserved_quantity', type: 'decimal', precision: 15, scale: 4 })
  reservedQuantity: number;

  @Column({ name: 'lot_number', length: 50, nullable: true })
  lotNumber: string;

  @Column({ name: 'receive_date', type: 'date', nullable: true })
  receiveDate: Date;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionPlan, plan => plan.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
