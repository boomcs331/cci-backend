import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ProductsStock } from '../products/entities/products-stock.entity';
import { ProductStockMovement } from './entities/product-stock-movement.entity';
import { OrderItem } from './entities';

const REF_TYPE = 'SALES_ORDER';

@Injectable()
export class SalesInventoryService {
  constructor(
    @InjectRepository(ProductsStock)
    private readonly stockRepo: Repository<ProductsStock>,
    @InjectRepository(ProductStockMovement)
    private readonly movementRepo: Repository<ProductStockMovement>,
  ) {}

  private num(v: string | number | undefined | null): number {
    if (v === undefined || v === null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }

  private async getOrCreateStock(
    manager: EntityManager,
    productId: number,
  ): Promise<ProductsStock> {
    let stock = await manager.findOne(ProductsStock, { where: { productId } });
    if (!stock) {
      stock = manager.create(ProductsStock, {
        productId,
        totalQty: '0',
        availableQty: '0',
        reservedQty: '0',
      });
      await manager.save(stock);
    }
    return stock;
  }

  private async logMovement(
    manager: EntityManager,
    params: {
      productId: number;
      movement: ProductStockMovement['movement'];
      quantity: number;
      refId: string;
      balanceAfter: number;
      note?: string;
      username: string;
    },
  ): Promise<void> {
    await manager.save(
      manager.create(ProductStockMovement, {
        productId: params.productId,
        movement: params.movement,
        quantity: String(params.quantity),
        refType: REF_TYPE,
        refId: params.refId,
        balanceAfter: String(params.balanceAfter),
        note: params.note ?? null,
        createBy: params.username || null,
      }),
    );
  }

  /** จองสต็อกเมื่ออนุมัติออเดอร์ */
  async reserveForOrder(
    manager: EntityManager,
    orderId: string,
    orderNo: string,
    items: Pick<OrderItem, 'productId' | 'quantity'>[],
    username: string,
  ): Promise<void> {
    for (const item of items) {
      const qty = this.num(item.quantity);
      if (qty <= 0) continue;

      const stock = await this.getOrCreateStock(manager, item.productId);
      const available = this.num(stock.availableQty);
      if (available + 1e-9 < qty) {
        throw new BadRequestException(
          `สต็อกสินค้า ID ${item.productId} ไม่พอ (คงเหลือ ${available}, ต้องการ ${qty}) — ออเดอร์ ${orderNo}`,
        );
      }

      stock.availableQty = String(available - qty);
      stock.reservedQty = String(this.num(stock.reservedQty) + qty);
      await manager.save(stock);

      await this.logMovement(manager, {
        productId: item.productId,
        movement: 'RESERVE',
        quantity: qty,
        refId: orderId,
        balanceAfter: this.num(stock.availableQty),
        note: `จองสต็อกออเดอร์ ${orderNo}`,
        username,
      });
    }
  }

  /** คืนสต็อกที่จองเมื่อยกเลิกก่อนจัดส่ง */
  async releaseForOrder(
    manager: EntityManager,
    orderId: string,
    orderNo: string,
    items: Pick<OrderItem, 'productId' | 'quantity'>[],
    username: string,
    reason?: string,
  ): Promise<void> {
    for (const item of items) {
      const qty = this.num(item.quantity);
      if (qty <= 0) continue;

      const stock = await this.getOrCreateStock(manager, item.productId);
      const reserved = this.num(stock.reservedQty);
      if (reserved + 1e-9 < qty) {
        throw new BadRequestException(
          `ข้อมูลสต็อกจองไม่สอดคล้อง (reserved ${reserved}, ต้องการคืน ${qty})`,
        );
      }

      stock.reservedQty = String(reserved - qty);
      stock.availableQty = String(this.num(stock.availableQty) + qty);
      await manager.save(stock);

      await this.logMovement(manager, {
        productId: item.productId,
        movement: 'RELEASE',
        quantity: qty,
        refId: orderId,
        balanceAfter: this.num(stock.availableQty),
        note: reason ?? `คืนสต็อกจองออเดอร์ ${orderNo}`,
        username,
      });
    }
  }

  /** ตัดสต็อกจริงเมื่อจัดส่ง */
  async shipForOrder(
    manager: EntityManager,
    orderId: string,
    orderNo: string,
    items: Pick<OrderItem, 'productId' | 'quantity'>[],
    username: string,
  ): Promise<void> {
    for (const item of items) {
      const qty = this.num(item.quantity);
      if (qty <= 0) continue;

      const stock = await this.getOrCreateStock(manager, item.productId);
      const total = this.num(stock.totalQty);
      const reserved = this.num(stock.reservedQty);

      if (reserved + 1e-9 < qty || total + 1e-9 < qty) {
        throw new BadRequestException(
          `สต็อกไม่พอสำหรับตัดจ่าย (total ${total}, reserved ${reserved}, ต้องการ ${qty})`,
        );
      }

      stock.totalQty = String(total - qty);
      stock.reservedQty = String(reserved - qty);
      await manager.save(stock);

      await this.logMovement(manager, {
        productId: item.productId,
        movement: 'OUT',
        quantity: qty,
        refId: orderId,
        balanceAfter: this.num(stock.totalQty),
        note: `ตัดสต็อกจัดส่งออเดอร์ ${orderNo}`,
        username,
      });
    }
  }

  async listMovementsByOrder(orderId: string) {
    return this.movementRepo.find({
      where: { refType: REF_TYPE, refId: orderId },
      order: { createDate: 'ASC' },
    });
  }
}
