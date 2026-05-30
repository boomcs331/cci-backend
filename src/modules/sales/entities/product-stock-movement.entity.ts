import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type StockMovementType = 'IN' | 'OUT' | 'RESERVE' | 'RELEASE';

@Entity({ name: 'product_stock_movements' })
export class ProductStockMovement {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ type: 'varchar', length: 10 })
  movement: StockMovementType;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: string;

  @Column({ name: 'ref_type', type: 'varchar', length: 20, nullable: true })
  refType: string | null;

  @Column({ name: 'ref_id', type: 'bigint', nullable: true })
  refId: string | null;

  @Column({
    name: 'balance_after',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  balanceAfter: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'create_by', type: 'varchar', length: 255, nullable: true })
  createBy: string | null;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;
}
