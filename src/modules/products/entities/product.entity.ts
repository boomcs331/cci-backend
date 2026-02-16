import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductBom } from './product-bom.entity';
import { Customer } from './customer.entity';
import { ProductLocation } from './product-location.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_code', length: 50, unique: true })
  productCode: string;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ name: 'default_location_id', nullable: true })
  defaultLocationId: number;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @Column({ name: 'safety_stock', type: 'decimal', precision: 10, scale: 2, default: 0 })
  safetyStock: number;

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

  @OneToMany(() => ProductBom, bom => bom.product)
  boms: ProductBom[];

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => ProductLocation, { nullable: true })
  @JoinColumn({ name: 'default_location_id' })
  defaultLocation: ProductLocation;
}
