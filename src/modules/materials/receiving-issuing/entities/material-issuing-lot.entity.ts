import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MaterialIssuing } from './material-issuing.entity';
import { MaterialReceivingLot } from './material-receiving-lot.entity';

@Entity('material_issuing_lots')
export class MaterialIssuingLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuing_id' })
  issuingId: number;

  @Column({ name: 'lot_id' })
  lotId: number;

  @Column({ name: 'qr_code', length: 100 })
  qrCode: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @ManyToOne(() => MaterialIssuing, issuing => issuing.lots)
  @JoinColumn({ name: 'issuing_id' })
  issuing: MaterialIssuing;

  @ManyToOne(() => MaterialReceivingLot)
  @JoinColumn({ name: 'lot_id' })
  lot: MaterialReceivingLot;
}
