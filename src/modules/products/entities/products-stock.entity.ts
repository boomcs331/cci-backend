import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity({ schema: 'master', name: 'products_stock' })
export class ProductsStock {
  @PrimaryColumn({ name: 'product_id' })
  productId: number;

  @Column({
    name: 'total_qty',
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0,
  })
  totalQty: string;

  @Column({
    name: 'available_qty',
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0,
  })
  availableQty: string;

  @Column({
    name: 'reserved_qty',
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0,
  })
  reservedQty: string;

  @UpdateDateColumn({ name: 'update_date', type: 'timestamptz' })
  updateDate: Date;

  @OneToOne(() => Product, (product) => product.stock)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
