import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductsStock } from './entities/products-stock.entity';
import { ProductSalesReservation } from './entities/product-sales-reservation.entity';
import { CreateProductSalesReservationDto } from './dto/product-sales-reservation.dto';
import {
  FgLotProductionSource,
  ProductFgLotService,
} from './product-fg-lot.service';

@Injectable()
export class ProductStockService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductsStock)
    private readonly stockRepo: Repository<ProductsStock>,
    @InjectRepository(ProductSalesReservation)
    private readonly salesResRepo: Repository<ProductSalesReservation>,
    private readonly fgLotService: ProductFgLotService,
    private readonly dataSource: DataSource,
  ) {}

  private num(v: string | number | undefined | null): number {
    if (v === undefined || v === null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }

  private toStockRow(p: Product): {
    id: number;
    productCode: string;
    productName: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    unit: string;
  } {
    return {
      id: p.id,
      productCode: p.productCode,
      productName: p.productName,
      currentStock: this.num(p.stock?.totalQty),
      reservedStock: this.num(p.stock?.reservedQty),
      availableStock: this.num(p.stock?.availableQty),
      minStock: p.minStock ?? 0,
      unit: p.unit?.name ?? '-',
    };
  }

  private applyProductStockFilters(
    qb: SelectQueryBuilder<Product>,
    search?: string,
  ): void {
    qb.where('p.isActive = :active', { active: true });
    if (search?.trim()) {
      qb.andWhere(
        '(p.productCode ILIKE :term OR p.productName ILIKE :term)',
        { term: `%${search.trim()}%` },
      );
    }
  }

  async ensureStockRow(manager: EntityManager, productId: number): Promise<void> {
    const existing = await manager.findOne(ProductsStock, {
      where: { productId },
    });
    if (existing) return;
    const row = manager.create(ProductsStock, {
      productId,
      totalQty: '0',
      availableQty: '0',
      reservedQty: '0',
    });
    await manager.save(row);
  }

  async addFinishedGoodsFromLot(
    manager: EntityManager,
    productId: number,
    quantity: number,
    source?: FgLotProductionSource,
  ): Promise<void> {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return;

    if (source) {
      await this.fgLotService.receiveFromProductionLot(
        manager,
        productId,
        q,
        source,
      );
    }

    let stock = await manager.findOne(ProductsStock, { where: { productId } });
    if (!stock) {
      stock = manager.create(ProductsStock, {
        productId,
        totalQty: '0',
        availableQty: '0',
        reservedQty: '0',
      });
    }
    const total = this.num(stock.totalQty) + q;
    const available = this.num(stock.availableQty) + q;
    stock.totalQty = String(total);
    stock.availableQty = String(available);
    await manager.save(stock);
  }

  async getStockListPaginated(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{
    data: ReturnType<ProductStockService['toStockRow']>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

    const countQb = this.productRepo.createQueryBuilder('p');
    this.applyProductStockFilters(countQb, search);
    const total = await countQb.getCount();

    const listQb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.stock', 'stock')
      .leftJoinAndSelect('p.unit', 'unit');
    this.applyProductStockFilters(listQb, search);
    const products = await listQb
      .orderBy('p.productCode', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getMany();

    const data = products.map((p) => this.toStockRow(p));
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  async getStockAlertSummary(): Promise<{
    lowStock: ReturnType<ProductStockService['toStockRow']>[];
    criticalStock: ReturnType<ProductStockService['toStockRow']>[];
  }> {
    const products = await this.productRepo.find({
      relations: ['stock', 'unit'],
      where: { isActive: true },
      order: { productCode: 'ASC' },
    });
    const rows = products.map((p) => this.toStockRow(p));
    return {
      lowStock: rows.filter((s) => s.availableStock <= s.minStock),
      criticalStock: rows.filter(
        (s) =>
          s.availableStock > s.minStock &&
          s.availableStock <= s.minStock * 2,
      ),
    };
  }

  async getSalesReservationsGrouped() {
    const reservations = await this.salesResRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.product', 'product')
      .leftJoinAndSelect('product.unit', 'unit')
      .where('r.status = :st', { st: 'ACTIVE' })
      .orderBy('r.productId', 'ASC')
      .addOrderBy('r.id', 'ASC')
      .getMany();

    type GroupRow = {
      productId: number;
      productCode: string;
      productName: string;
      unit: string;
      totalReserved: number;
      details: {
        id: string;
        referenceNo: string;
        quantity: number;
        createDate: Date;
      }[];
    };

    const grouped: Record<number, GroupRow> = {};
    for (const res of reservations) {
      const key = res.productId;
      if (!grouped[key]) {
        grouped[key] = {
          productId: res.product.id,
          productCode: res.product.productCode,
          productName: res.product.productName,
          unit: res.product.unit?.name ?? '-',
          totalReserved: 0,
          details: [],
        };
      }
      const qty = this.num(res.reservedQuantity);
      grouped[key].totalReserved += qty;
      grouped[key].details.push({
        id: res.id,
        referenceNo: res.referenceNo,
        quantity: qty,
        createDate: res.createDate,
      });
    }

    return Object.values(grouped);
  }

  async createSalesReservation(
    dto: CreateProductSalesReservationDto,
    username: string,
  ) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
      relations: ['stock'],
    });
    if (!product) throw new NotFoundException('Product not found');

    let stock = product.stock;
    if (!stock) {
      stock = this.stockRepo.create({
        productId: product.id,
        totalQty: '0',
        availableQty: '0',
        reservedQty: '0',
      });
      await this.stockRepo.save(stock);
    }

    const qty = Number(dto.quantity);
    const available = this.num(stock.availableQty);
    if (available + 1e-9 < qty) {
      throw new BadRequestException(
        `สต็อกพร้อมขายไม่พอ (คงเหลือ ${available} ต้องการจอง ${qty})`,
      );
    }

    stock.availableQty = String(available - qty);
    stock.reservedQty = String(this.num(stock.reservedQty) + qty);
    await this.stockRepo.save(stock);

    const row = this.salesResRepo.create({
      referenceNo: dto.referenceNo.trim(),
      productId: product.id,
      reservedQuantity: String(qty),
      status: 'ACTIVE',
      notes: dto.notes?.trim() || null,
      createBy: username,
    });
    return this.salesResRepo.save(row);
  }

  async releaseSalesReservation(id: string) {
    const res = await this.salesResRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!res) throw new NotFoundException('Reservation not found');
    if (res.status !== 'ACTIVE') {
      throw new BadRequestException('จองนี้ไม่สามารถยกเลิกได้ (สถานะไม่ใช่ ACTIVE)');
    }

    const stock = await this.stockRepo.findOne({
      where: { productId: res.productId },
    });
    if (!stock) throw new NotFoundException('Stock row not found');

    const q = this.num(res.reservedQuantity);
    stock.reservedQty = String(Math.max(0, this.num(stock.reservedQty) - q));
    stock.availableQty = String(this.num(stock.availableQty) + q);
    await this.stockRepo.save(stock);

    res.status = 'RELEASED';
    return this.salesResRepo.save(res);
  }

  async fulfillSalesReservation(id: string, username = 'system') {
    return this.dataSource.transaction(async (manager) => {
      const res = await manager.findOne(ProductSalesReservation, { where: { id } });
      if (!res) throw new NotFoundException('Reservation not found');
      if (res.status !== 'ACTIVE') {
        throw new BadRequestException(
          'จองนี้ไม่สามารถตัดขายได้ (สถานะไม่ใช่ ACTIVE)',
        );
      }

      const stock = await manager.findOne(ProductsStock, {
        where: { productId: res.productId },
      });
      if (!stock) throw new NotFoundException('Stock row not found');

      const q = this.num(res.reservedQuantity);
      const total = this.num(stock.totalQty);
      const reserved = this.num(stock.reservedQty);
      if (reserved + 1e-9 < q || total + 1e-9 < q) {
        throw new BadRequestException('ข้อมูลสต็อกไม่สอดคล้องกับการจอง');
      }

      stock.totalQty = String(total - q);
      stock.reservedQty = String(reserved - q);
      await manager.save(stock);

      await this.fgLotService.issueFromFgLotsFifo(manager, res.productId, q, {
        referenceNo: res.referenceNo,
        salesReservationId: res.id,
        createBy: username,
        remarks: 'ตัดขายจากการจอง',
      });

      res.status = 'FULFILLED';
      return manager.save(res);
    });
  }
}
