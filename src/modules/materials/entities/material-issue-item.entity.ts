import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MaterialIssue } from './material-issue.entity';
import { Material } from './material.entity';
import { MaterialsLocation } from './materials-location.entity';

@Entity('material_issue_items')
export class MaterialIssueItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issue_id' })
  issueId: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'quantity_per_unit', type: 'decimal', precision: 15, scale: 4, nullable: true })
  quantityPerUnit: number;

  @Column({ name: 'issued_quantity', type: 'decimal', precision: 15, scale: 4 })
  issuedQuantity: number;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ name: 'from_location_id', nullable: true })
  fromLocationId: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'create_by', length: 255, nullable: true })
  createBy: string;

  @ManyToOne(() => MaterialIssue, issue => issue.items)
  @JoinColumn({ name: 'issue_id' })
  issue: MaterialIssue;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
