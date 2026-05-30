import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlanningBatch } from './planning-batch.entity';
import { PlanningRow } from './planning-row.entity';

export enum HistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  OVERWRITE = 'OVERWRITE',
}

@Entity({ schema: 'sales', name: 'planning_history' })
export class PlanningHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id', type: 'int' })
  batchId: number;

  @Column({ name: 'planning_row_id', type: 'bigint', nullable: true })
  planningRowId: number;

  @Column({
    type: 'enum',
    enum: HistoryAction,
  })
  action: HistoryAction;

  @Column({ name: 'old_quantity', type: 'decimal', precision: 15, scale: 2, nullable: true })
  oldQuantity: number;

  @Column({ name: 'new_quantity', type: 'decimal', precision: 15, scale: 2, nullable: true })
  newQuantity: number;

  @Column({ name: 'changed_by', type: 'int' })
  changedBy: number;

  @Column({ name: 'changed_at', type: 'timestamp' })
  changedAt: Date;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => PlanningBatch, (batch) => batch.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: PlanningBatch;

  @ManyToOne(() => PlanningRow, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planning_row_id' })
  planningRow: PlanningRow;
}
