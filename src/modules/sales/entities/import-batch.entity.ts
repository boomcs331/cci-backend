import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ImportRow } from './import-row.entity';

export type ImportBatchStatus = 'PENDING' | 'VALIDATED' | 'COMMITTED' | 'FAILED';

@Entity({ schema: 'sales', name: 'import_batches' })
export class ImportBatch {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'batch_code', length: 50, unique: true })
  batchCode: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'uploaded_by', type: 'int' })
  uploadedBy: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: ImportBatchStatus;

  @Column({ name: 'total_rows', type: 'int', default: 0 })
  totalRows: number;

  @Column({ name: 'valid_rows', type: 'int', default: 0 })
  validRows: number;

  @Column({ name: 'error_rows', type: 'int', default: 0 })
  errorRows: number;

  @Column({ name: 'committed_rows', type: 'int', default: 0 })
  committedRows: number;

  @Column({ name: 'error_summary', type: 'jsonb', nullable: true })
  errorSummary: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'committed_at', type: 'timestamptz', nullable: true })
  committedAt: Date | null;

  @OneToMany(() => ImportRow, (row) => row.batch, { cascade: true })
  rows: ImportRow[];
}
