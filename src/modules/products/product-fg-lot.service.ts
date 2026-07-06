import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { ProductFgLot } from './entities/product-fg-lot.entity';
import { ProductFgLotMovement } from './entities/product-fg-lot-movement.entity';
import { Product } from './entities/product.entity';

export type FgLotProductionSource = {
  productionLotId: number;
  productionLotNo: string;
  productionQrCode: string;
  productionOrderNo: string;
  createBy?: string;
};

@Injectable()
export class ProductFgLotService {
  constructor(
    @InjectRepository(ProductFgLot)
    private readonly fgLotRepo: Repository<ProductFgLot>,
    @InjectRepository(ProductFgLotMovement)
    private readonly movementRepo: Repository<ProductFgLotMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private num(v: string | number | null | undefined): number {
    if (v === undefined || v === null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }

  async receiveFromProductionLot(
    manager: EntityManager,
    productId: number,
    quantity: number,
    source: FgLotProductionSource,
  ): Promise<ProductFgLot | null> {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return null;

    const existing = await manager.findOne(ProductFgLot, {
      where: { productionLotId: source.productionLotId },
    });
    if (existing) return existing;

    const lotNo = `FG-${source.productionLotNo}`;
    const qrCode = `FG-${source.productionQrCode}`;

    const fgLot = manager.create(ProductFgLot, {
      productId,
      lotNo,
      qrCode,
      productionLotId: source.productionLotId,
      productionOrderNo: source.productionOrderNo,
      quantity: q,
      remainingQuantity: q,
      unit: 'PCS',
      status: 'AVAILABLE',
      sourceType: 'PRODUCTION',
      createBy: source.createBy ?? null,
    });
    const saved = await manager.save(fgLot);

    const movement = manager.create(ProductFgLotMovement, {
      fgLotId: saved.id,
      stepCode: 'PRODUCTION_RECEIVE',
      stepName: 'รับเข้าจากผลิต (ปิดงานล็อต)',
      movementType: 'RECEIVE',
      quantityIn: q,
      quantityOut: null,
      referenceNo: source.productionOrderNo,
      movementDate: new Date(),
      createBy: source.createBy ?? null,
      remarks: `ล็อตผลิต ${source.productionLotNo}`,
    });
    await manager.save(movement);

    return saved;
  }

  async issueFromFgLotsFifo(
    manager: EntityManager,
    productId: number,
    quantity: number,
    opts: {
      referenceNo: string;
      salesReservationId?: string;
      createBy?: string;
      remarks?: string;
    },
  ): Promise<void> {
    let remaining = Number(quantity);
    if (!Number.isFinite(remaining) || remaining <= 0) return;

    const lots = await manager
      .createQueryBuilder(ProductFgLot, 'fg')
      .where('fg.productId = :productId', { productId })
      .andWhere('fg.status IN (:...statuses)', {
        statuses: ['AVAILABLE', 'PARTIAL_USED'],
      })
      .andWhere('fg.remainingQuantity > 0')
      .orderBy('fg.createDate', 'ASC')
      .addOrderBy('fg.id', 'ASC')
      .getMany();

    for (const lot of lots) {
      if (remaining <= 0) break;
      const avail = this.num(lot.remainingQuantity);
      if (avail <= 0) continue;

      const issueQty = Math.min(avail, remaining);
      lot.remainingQuantity = avail - issueQty;
      lot.status =
        lot.remainingQuantity <= 0
          ? 'USED_UP'
          : 'PARTIAL_USED';
      await manager.save(lot);

      const movement = manager.create(ProductFgLotMovement, {
        fgLotId: lot.id,
        stepCode: 'SALES_ISSUE',
        stepName: 'จ่ายออก (ตัดขาย / fulfill)',
        movementType: 'ISSUE',
        quantityIn: null,
        quantityOut: issueQty,
        referenceNo: opts.referenceNo,
        salesReservationId: opts.salesReservationId ?? null,
        movementDate: new Date(),
        createBy: opts.createBy ?? null,
        remarks: opts.remarks ?? null,
      });
      await manager.save(movement);

      remaining -= issueQty;
    }
  }

  async getFgLotTraceReport(filters: {
    startDate?: string;
    endDate?: string;
    orderNo?: string;
    lotSearch?: string;
    productId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 30));
    const skip = (page - 1) * limit;

    const qb = this.fgLotRepo
      .createQueryBuilder('fg')
      .innerJoinAndSelect('fg.product', 'product')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('fg.movements', 'movement')
      .orderBy('product.productCode', 'ASC')
      .addOrderBy('fg.createDate', 'DESC')
      .addOrderBy('fg.id', 'DESC')
      .addOrderBy('movement.movementDate', 'ASC')
      .addOrderBy('movement.id', 'ASC');

    if (filters.startDate?.trim()) {
      qb.andWhere('fg.createDate >= :startDate::date', {
        startDate: filters.startDate.trim(),
      });
    }
    if (filters.endDate?.trim()) {
      qb.andWhere("fg.createDate < (:endDate::date + interval '1 day')", {
        endDate: filters.endDate.trim(),
      });
    }
    if (filters.orderNo?.trim()) {
      qb.andWhere('fg.productionOrderNo ILIKE :orderNo', {
        orderNo: `%${filters.orderNo.trim()}%`,
      });
    }
    if (filters.lotSearch?.trim()) {
      const q = `%${filters.lotSearch.trim()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('fg.lotNo ILIKE :lotQ', { lotQ: q })
            .orWhere('fg.qrCode ILIKE :lotQ', { lotQ: q });
        }),
      );
    }
    if (filters.productId) {
      qb.andWhere('fg.productId = :productId', {
        productId: filters.productId,
      });
    }
    if (filters.status?.trim()) {
      qb.andWhere('fg.status = :st', { st: filters.status.trim().toUpperCase() });
    }

    const total = await qb.getCount();
    const lots = await qb.skip(skip).take(limit).getMany();

    const data = lots.map((fg) => {
      const movements = [...(fg.movements ?? [])].sort(
        (a, b) =>
          new Date(a.movementDate).getTime() -
            new Date(b.movementDate).getTime() ||
          Number(a.id) - Number(b.id),
      );

      type StepRow = {
        stepOrder: number;
        processId: number;
        processCode: string;
        processName: string;
        stepCode: string;
        stepName: string;
        status: 'pending' | 'in_progress' | 'completed' | 'rejected';
        quantityIn: number | null;
        quantityOut: number | null;
        operator: string | null;
        startTime: Date | null;
        endTime: Date | null;
        remarks: string | null;
      };

      const steps: StepRow[] = movements.map((m, idx) => ({
        stepOrder: idx + 1,
        processId: idx + 1,
        processCode: m.stepCode,
        processName: m.stepName,
        stepCode: m.stepCode,
        stepName: m.stepName,
        status: 'completed',
        quantityIn: m.quantityIn != null ? this.num(m.quantityIn) : null,
        quantityOut: m.quantityOut != null ? this.num(m.quantityOut) : null,
        operator: m.createBy ?? null,
        startTime: m.movementDate,
        endTime: m.movementDate,
        remarks: m.remarks ?? m.referenceNo ?? null,
      }));

      if (steps.length === 0) {
        steps.push({
          stepOrder: 1,
          processId: 1,
          processCode: 'PRODUCTION_RECEIVE',
          processName: 'รับเข้าจากผลิต (ปิดงานล็อต)',
          stepCode: 'PRODUCTION_RECEIVE',
          stepName: 'รับเข้าจากผลิต (ปิดงานล็อต)',
          status: 'pending',
          quantityIn: this.num(fg.quantity),
          quantityOut: null,
          operator: null,
          startTime: fg.createDate,
          endTime: null,
          remarks: 'ยังไม่มีบันทึก movement',
        });
      }

      return {
        lotId: fg.id,
        lotNo: fg.lotNo,
        qrCode: fg.qrCode,
        lotQuantity: this.num(fg.quantity),
        remainingQuantity: this.num(fg.remainingQuantity),
        lotStatus: fg.status,
        productionLotId: fg.productionLotId ?? null,
        lotCreatedAt: fg.createDate,
        orderNo: fg.productionOrderNo ?? null,
        productId: fg.productId,
        productCode: fg.product?.productCode ?? null,
        productName: fg.product?.productName ?? null,
        unit: fg.product?.unit?.name ?? fg.unit ?? 'PCS',
        steps,
        splitChildren: [] as [],
      };
    });

    return {
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }
}
