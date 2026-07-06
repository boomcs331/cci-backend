import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialIssuing } from './material-issuing.entity';

@Entity('material_issuing_documents')
export class MaterialIssuingDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuing_id' })
  issuingId: number;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_type', length: 50, nullable: true })
  fileType: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: number;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @ManyToOne(() => MaterialIssuing)
  @JoinColumn({ name: 'issuing_id' })
  issuing: MaterialIssuing;
}
