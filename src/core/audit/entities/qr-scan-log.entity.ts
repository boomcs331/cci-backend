import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum QrScanDomain {
  MATERIAL = 'MATERIAL',
  PRODUCTION = 'PRODUCTION',
}

export enum QrScanAction {
  MATERIAL_LOT_LOOKUP = 'MATERIAL_LOT_LOOKUP',
  MATERIAL_TX_LOOKUP = 'MATERIAL_TX_LOOKUP',
  PRODUCTION_STATION_LOOKUP = 'PRODUCTION_STATION_LOOKUP',
  PRODUCTION_STATUS_LOOKUP = 'PRODUCTION_STATUS_LOOKUP',
  PRODUCTION_STEP_START = 'PRODUCTION_STEP_START',
  PRODUCTION_STEP_COMPLETE = 'PRODUCTION_STEP_COMPLETE',
}

@Entity({ schema: 'logs', name: 'qr_scan_logs' })
@Index(['loggedAt'])
@Index(['domain', 'action'])
@Index(['qrCode'])
export class QrScanLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'logged_at', type: 'timestamp' })
  loggedAt: Date;

  @Column({ type: 'varchar', length: 30 })
  domain: QrScanDomain;

  @Column({ type: 'varchar', length: 40 })
  action: QrScanAction;

  @Column({ name: 'qr_code', type: 'varchar', length: 255 })
  qrCode: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string | null;

  @Column({ name: 'department_id', type: 'varchar', length: 64, nullable: true })
  departmentId?: string | null;

  @Column({ name: 'is_success', type: 'boolean', default: true })
  isSuccess: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;
}
