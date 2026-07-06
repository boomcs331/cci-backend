import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialIssueItem } from './material-issue-item.entity';
import { MaterialIssueDocument } from './material-issue-document.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('material_issues')
export class MaterialIssue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_no', length: 50, unique: true })
  issueNo: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'issue_type', length: 20 })
  issueType: string; // MANUAL, PRODUCTION

  @Column({ name: 'production_order_no', length: 50, nullable: true })
  productionOrderNo: string;

  @Column({ name: 'product_id', nullable: true })
  productId: number;

  @Column({ name: 'production_quantity', nullable: true })
  productionQuantity: number;

  @Column({ name: 'document_no', length: 50, nullable: true })
  documentNo: string;

  @Column({ name: 'document_file', type: 'text', nullable: true })
  documentFile: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ length: 20, default: 'COMPLETED' })
  status: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @Column({ name: 'update_by', length: 255, nullable: true })
  updateBy: string;

  @OneToMany(() => MaterialIssueItem, (item) => item.issue)
  items: MaterialIssueItem[];

  @OneToMany(() => MaterialIssueDocument, (doc) => doc.issue)
  documents: MaterialIssueDocument[];

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
