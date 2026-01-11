import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Material } from './material.entity';

@Entity('items_name')
export class ItemsName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @OneToOne(() => Material, material => material.itemsName)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}