import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';

@Entity({ schema: 'master', name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_code', length: 50, unique: true })
  code: string;

  @Column({ name: 'customer_name', length: 255 })
  name: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

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

  // Sales-specific fields (Phase 5)
  @Column({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditLimit: number;

  @Column({ name: 'credit_balance', type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditBalance: number;

  @Column({ name: 'payment_terms', length: 100, nullable: true })
  paymentTerms: string;

  @Column({ name: 'tax_id', length: 50, nullable: true })
  taxId: string;

  @OneToMany(() => Product, (product) => product.customer)
  products: Product[];
}
