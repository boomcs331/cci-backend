import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { MaterialsType } from './materials-type.entity';
import { MaterialsLocation } from './materials-location.entity';
import { ItemsName } from './items-name.entity';
import { MaterialsStock } from './materials-stock.entity';
import { Supplier } from './supplier.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mat_code', length: 50, unique: true })
  matCode: string;

  @Column({ name: 'mat_type_id' })
  matTypeId: number;

  @Column({ name: 'default_location_id' })
  defaultLocationId: number;

  @Column({ length: 2, nullable: true })
  lr: string;

  @Column({ name: 'lot_size', nullable: true })
  lotSize: number;

  @Column({ length: 50, nullable: true })
  unit: string;

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

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

  @ManyToOne(() => MaterialsType, materialsType => materialsType.materials)
  @JoinColumn({ name: 'mat_type_id' })
  materialsType: MaterialsType;

  @ManyToOne(() => MaterialsLocation, location => location.materials)
  @JoinColumn({ name: 'default_location_id' })
  defaultLocation: MaterialsLocation;

  @ManyToOne(() => Supplier, supplier => supplier.materials)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @OneToOne(() => ItemsName, itemsName => itemsName.material)
  itemsName: ItemsName;

  @OneToOne(() => MaterialsStock, stock => stock.material)
  stock: MaterialsStock;
}