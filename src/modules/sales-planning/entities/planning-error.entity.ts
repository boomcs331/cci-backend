import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ErrorSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

@Entity({ schema: 'sales', name: 'planning_errors' })
export class PlanningError {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_id', type: 'int' })
  batchId: number;

  @Column({ name: 'row_number', type: 'int' })
  rowNumber: number;

  @Column({ name: 'error_type', length: 50 })
  errorType: string;

  @Column({ name: 'error_code', length: 50 })
  errorCode: string;

  @Column({ name: 'error_message', type: 'text' })
  errorMessage: string;

  @Column({ name: 'field_name', length: 50, nullable: true })
  fieldName: string;

  @Column({ name: 'field_value', type: 'text', nullable: true })
  fieldValue: string;

  @Column({
    type: 'enum',
    enum: ErrorSeverity,
    default: ErrorSeverity.ERROR,
  })
  severity: ErrorSeverity;

  @Column({ name: 'error_details', type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne('PlanningBatch', 'errors', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: any;
}
