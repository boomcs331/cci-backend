import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'master', name: 'production_processes' })
export class ProductionProcess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'process_code', length: 50, unique: true })
  processCode: string;

  @Column({ name: 'process_name', length: 255 })
  processName: string;

  @Column({ name: 'sequence_order' })
  sequenceOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /** If set, only users whose auth.departments.code is listed (or ADMIN_GLOBAL) may start/complete this step. */
  @Column('text', {
    array: true,
    nullable: true,
    name: 'allowed_department_codes',
  })
  allowedDepartmentCodes?: string[] | null;
}
