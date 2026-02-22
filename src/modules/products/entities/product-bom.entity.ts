import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('product_bom')
export class ProductBom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'quantity_per_unit', type: 'decimal', precision: 15, scale: 4 })
  quantityPerUnit: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'sequence_order', nullable: true })
  sequenceOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @ManyToOne(() => Product, product => product.boms)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
