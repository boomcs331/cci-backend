import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

@Entity({ schema: 'sales', name: 'order_approvals' })
export class OrderApproval {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: string;

  @Column({ type: 'varchar', length: 10 })
  decision: ApprovalDecision;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'approver_id', type: 'varchar', length: 64 })
  approverId: string;

  @CreateDateColumn({ name: 'decided_at', type: 'timestamptz' })
  decidedAt: Date;
}
