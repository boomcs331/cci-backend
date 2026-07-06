import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Material } from './material.entity';

@Entity({ schema: 'master', name: 'supplier' })
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  contact_person: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'create_date' })
  create_date: Date;

  @Column({ length: 255, nullable: true })
  create_by: string;

  @UpdateDateColumn({ name: 'update_date' })
  update_date: Date;

  @Column({ length: 255, nullable: true })
  update_by: string;

  @OneToMany(() => Material, (material) => material.supplier)
  materials: Material[];
}
