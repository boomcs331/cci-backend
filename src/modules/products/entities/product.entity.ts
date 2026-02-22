import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductBom } from './product-bom.entity';
import { Customer } from './customer.entity';
import { ProductLocation } from './product-location.entity';
import { ProductType } from './product-type.entity';
import { ProductModel } from './product-model.entity';
import { ProductDeliveryType } from './product-delivery-type.entity';
import { ProductUnit } from './product-unit.entity';
import { ProductLoadingPoint } from './product-loading-point.entity';
import { ProductProcessLine } from './product-process-line.entity';

@Entity('products')
export class Product {
@PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_code', length: 50, unique: true })
  productCode: string;

  @Column({ name: 'product_name', length: 50, unique: true })
  productName: string;

  @Column({ name: 'product_type_id', nullable: true })
  productTypeId: number;

  @Column({ name: 'default_location_id', nullable: true })
  defaultLocationId: number;

  @Column({ length: 2, nullable: true })
  lr: string;

  @Column({ name: 'lot_size', nullable: true })
  lotSize: number;

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

  @Column({ name: 'min_stock', type: 'smallint', nullable: true })
  minStock: number;

  @Column({ name: 'customer_id', nullable: true })
  customerId: number;

  @Column({ name: 'model_id', nullable: true })
  modelId: number;

  @Column({ name: 'delivery_type_id', nullable: true })
  deliveryTypeId: number;

  @Column({ name: 'unit_id', nullable: true })
  unitId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  scale: string;

  @Column({ name: 'loading_point_id', nullable: true })
  loadingPointId: number;

  @Column({ name: 'process_line_id', nullable: true })
  processLineId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => ProductBom, bom => bom.product)
  boms: ProductBom[];

  @ManyToOne(() => ProductType, type => type.products)
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductType;

  @ManyToOne(() => ProductLocation, location => location.products)
  @JoinColumn({ name: 'default_location_id' })
  defaultLocation: ProductLocation;

  @ManyToOne(() => Customer, customer => customer.products)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => ProductModel, model => model.products)
  @JoinColumn({ name: 'model_id' })
  model: ProductModel;

  @ManyToOne(() => ProductDeliveryType, deliveryType => deliveryType.products)
  @JoinColumn({ name: 'delivery_type_id' })
  deliveryType: ProductDeliveryType;

  @ManyToOne(() => ProductUnit, unit => unit.products)
  @JoinColumn({ name: 'unit_id' })
  unit: ProductUnit;

  @ManyToOne(() => ProductLoadingPoint, loadingPoint => loadingPoint.products)
  @JoinColumn({ name: 'loading_point_id' })
  loadingPoint: ProductLoadingPoint;

  @ManyToOne(() => ProductProcessLine, processLine => processLine.products)
  @JoinColumn({ name: 'process_line_id' })
  processLine: ProductProcessLine;
}
