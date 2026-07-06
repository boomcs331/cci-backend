import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { MaterialsType } from './materials-type.entity';
import { MaterialsLocation } from './materials-location.entity';
import { MaterialsStock } from './materials-stock.entity';
import { Supplier } from './supplier.entity';
import { Model } from './model.entity';
import { DeliveryType } from './delivery-type.entity';
import { Unit } from './unit.entity';
import { LoadingPoint } from './loading-point.entity';
import { ProcessLine } from './process-line.entity';

@Entity({ schema: 'master', name: 'materials' })
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mat_code', length: 50, unique: true })
  matCode: string;

  @Column({ name: 'mat_name', length: 50, unique: true })
  matName: string;

  @Column({ name: 'mat_type_id' })
  matTypeId: number;

  @Column({ name: 'default_location_id' })
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

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: number;

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

  /** Relative path e.g. uploads/material-workpieces/xxx.jpg (served under /uploads/) */
  @Column({
    name: 'workpiece_image_path',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  workpieceImagePath: string | null;

  @ManyToOne(() => MaterialsType, (materialsType) => materialsType.materials)
  @JoinColumn({ name: 'mat_type_id' })
  materialsType: MaterialsType;

  @ManyToOne(() => MaterialsLocation, (location) => location.materials)
  @JoinColumn({ name: 'default_location_id' })
  defaultLocation: MaterialsLocation;

  @ManyToOne(() => Supplier, (supplier) => supplier.materials)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => Model, (model) => model.materials)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @ManyToOne(() => DeliveryType, (deliveryType) => deliveryType.materials)
  @JoinColumn({ name: 'delivery_type_id' })
  deliveryType: DeliveryType;

  @ManyToOne(() => Unit, (unit) => unit.materials)
  @JoinColumn({ name: 'unit_id' })
  unitMaster: Unit;

  @ManyToOne(() => LoadingPoint, (loadingPoint) => loadingPoint.materials)
  @JoinColumn({ name: 'loading_point_id' })
  loadingPoint: LoadingPoint;

  @ManyToOne(() => ProcessLine, (processLine) => processLine.materials)
  @JoinColumn({ name: 'process_line_id' })
  processLine: ProcessLine;

  @OneToOne(() => MaterialsStock, (stock) => stock.material)
  stock: MaterialsStock;
}
