import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('production_material_requirements')
export class ProductionMaterialRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'production_order_id' })
  productionOrderId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'required_quantity', type: 'decimal', precision: 15, scale: 4 })
  requiredQuantity: number;

  @Column({ name: 'issued_quantity', type: 'decimal', precision: 15, scale: 4, default: 0 })
  issuedQuantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ length: 50, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => ProductionOrder, order => order.materialRequirements)
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
