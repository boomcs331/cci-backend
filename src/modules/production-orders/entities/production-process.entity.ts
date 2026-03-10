import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('production_processes')
export class ProductionProcess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'process_code', length: 50 })
  processCode: string;

  @Column({ name: 'process_name', length: 255 })
  processName: string;

  @Column({ name: 'sequence_order' })
  sequenceOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
