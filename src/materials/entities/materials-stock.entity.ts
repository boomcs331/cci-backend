import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Material } from './material.entity';

@Entity('materials_stock')
export class MaterialsStock {
  @PrimaryColumn({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'total_qty', default: 0 })
  totalQty: number;

  @Column({ name: 'available_qty', default: 0 })
  availableQty: number;

  @Column({ name: 'reserved_qty', default: 0 })
  reservedQty: number;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @OneToOne(() => Material, material => material.stock)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}