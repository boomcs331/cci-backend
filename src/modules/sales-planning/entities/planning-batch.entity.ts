import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PlanningRow } from './planning-row.entity';
import { PlanningError } from './planning-error.entity';
import { PlanningHistory } from './planning-history.entity';

export enum BatchStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity({ schema: 'sales', name: 'planning_batches' })
export class PlanningBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_code', length: 50, unique: true })
  batchCode: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PENDING,
  })
  status: BatchStatus;

  @Column({ name: 'total_rows', type: 'int', default: 0 })
  totalRows: number;

  @Column({ name: 'success_rows', type: 'int', default: 0 })
  successRows: number;

  @Column({ name: 'error_rows', type: 'int', default: 0 })
  errorRows: number;

  @Column({ name: 'skipped_rows', type: 'int', default: 0 })
  skippedRows: number;

  @Column({ name: 'file_name', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'file_hash', length: 64, nullable: true })
  fileHash: string;

  @Column({ name: 'uploaded_by', type: 'int' })
  uploadedBy: number;

  @Column({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'processing_duration_ms', type: 'int', nullable: true })
  processingDurationMs: number;

  @Column({ name: 'error_summary', type: 'jsonb', nullable: true })
  errorSummary: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany('PlanningRow', 'batch')
  rows: PlanningRow[];

  @OneToMany('PlanningError', 'batch')
  errors: PlanningError[];

  @OneToMany('PlanningHistory', 'batch')
  history: PlanningHistory[];
}
