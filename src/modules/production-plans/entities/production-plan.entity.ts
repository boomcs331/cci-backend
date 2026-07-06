import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductionPlanItem } from './production-plan-item.entity';
import { MaterialReservation } from './material-reservation.entity';

export enum PlanStatus {
  DRAFT = 'draft',
  RESERVED = 'reserved',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('production_plans')
export class ProductionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_code', length: 50, unique: true })
  planCode: string;

  @Column({ name: 'plan_name', length: 255 })
  planName: string;

  @Column({ name: 'plan_date', type: 'date' })
  planDate: Date;

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.DRAFT })
  status: PlanStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255 })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @OneToMany(() => ProductionPlanItem, (item) => item.plan)
  items: ProductionPlanItem[];

  @OneToMany(() => MaterialReservation, (reservation) => reservation.plan)
  reservations: MaterialReservation[];
}
