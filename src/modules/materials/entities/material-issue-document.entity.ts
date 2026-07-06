import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialIssue } from './material-issue.entity';

@Entity('material_issue_documents')
export class MaterialIssueDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id' })
  issueId: number;

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

  @ManyToOne(() => MaterialIssue, (issue) => issue.documents)
  @JoinColumn({ name: 'issue_id' })
  issue: MaterialIssue;
}
