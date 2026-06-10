import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { Customer } from '../../products/entities/customer.entity';
import {
  SalesOrder,
  OrderItem,
  OrderStatusHistory,
  OrderApproval,
  type SalesOrderStatus,
} from '../entities';
import {
  CreateOrderDto,
  UpdateOrderDto,
  QueryOrdersDto,
  RejectOrderDto,
  CancelOrderDto,
} from '../dto';
import type { TransitionOrderStatusDto } from '../dto';
import { SalesInventoryService } from './sales-inventory.service';
import {
  canTransition,
  requiresStockRelease,
  shipsStockOnEnter,
} from './sales-order.state-machine';
import * as xlsx from 'xlsx';
import PDFDocument from 'pdfkit';

const EDITABLE_STATUSES: SalesOrderStatus[] = ['DRAFT', 'PENDING'];

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(OrderApproval)
    private readonly approvalRepo: Repository<OrderApproval>,
    private readonly inventoryService: SalesInventoryService,
    private readonly dataSource: DataSource,
  ) {}

  /** SO-YYYYMM-#### โดยนับลำดับล่าสุดของเดือนปัจจุบัน */
  private async generateOrderNo(): Promise<string> {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SO-${yyyymm}-`;

    const last = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.orderNo', 'orderNo')
      .where('o.orderNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('o.orderNo', 'DESC')
      .limit(1)
      .getRawOne<{ orderNo: string }>();

    let next = 1;
    if (last?.orderNo) {
      const seq = parseInt(last.orderNo.slice(prefix.length), 10);
      if (!Number.isNaN(seq)) next = seq + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  private computeTotals<
    T extends { quantity: number; unitPrice?: number; discount?: number },
  >(items: T[]) {
    let subtotal = 0;
    let discountTotal = 0;
    const lines = items.map((it) => {
      const price = it.unitPrice ?? 0;
      const discount = it.discount ?? 0;
      const gross = it.quantity * price;
      if (discount > gross) {
        throw new BadRequestException('ส่วนลดมากกว่ามูลค่าสินค้าในรายการ');
      }
      const lineTotal = gross - discount;
      subtotal += gross;
      discountTotal += discount;
      return { ...it, price, discount, lineTotal };
    });
    return {
      lines,
      subtotal,
      discountTotal,
      grandTotal: subtotal - discountTotal,
    };
  }

  async create(dto: CreateOrderDto, username: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new BadRequestException('ไม่พบลูกค้าในระบบ');
    }

    const totals = this.computeTotals(dto.items);
    const status: SalesOrderStatus = dto.status ?? 'DRAFT';

    const saved = await this.dataSource.transaction(async (manager) => {
      const orderNo = await this.generateOrderNo();
      const order = manager.create(SalesOrder, {
        orderNo,
        customerId: dto.customerId,
        salesUserId: username || null,
        status,
        salesChannel: dto.salesChannel ?? null,
        orderDate: dto.orderDate ?? new Date().toISOString().slice(0, 10),
        requiredDate: dto.requiredDate ?? null,
        deliveryDate: dto.deliveryDate ?? null,
        subtotal: totals.subtotal.toFixed(2),
        discountTotal: totals.discountTotal.toFixed(2),
        grandTotal: totals.grandTotal.toFixed(2),
        note: dto.note ?? null,
        source: 'MANUAL',
        createBy: username || null,
        updateBy: username || null,
      });
      const savedOrder = await manager.save(order);

      const items = totals.lines.map((line) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: line.productId,
          quantity: String(line.quantity),
          unitPrice: line.price.toFixed(2),
          discount: line.discount.toFixed(2),
          lineTotal: line.lineTotal.toFixed(2),
        }),
      );
      await manager.save(items);

      await manager.save(
        manager.create(OrderStatusHistory, {
          orderId: savedOrder.id,
          fromStatus: null,
          toStatus: status,
          reason: 'สร้างออเดอร์',
          changedBy: username || null,
        }),
      );

      return savedOrder;
    });

    return ResponseHelper.success(await this.findOneEntity(saved.id), 'สร้างออเดอร์สำเร็จ');
  }

  async findAll(query: QueryOrdersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const sortColumnMap: Record<string, string> = {
      orderNo: 'o.orderNo',
      orderDate: 'o.orderDate',
      deliveryDate: 'o.deliveryDate',
      grandTotal: 'o.grandTotal',
      status: 'o.status',
      createDate: 'o.createDate',
    };
    const sortBy = sortColumnMap[query.sortBy ?? 'createDate'] ?? 'o.createDate';
    const sortDir = query.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer');

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere('o.customerId = :customerId', {
        customerId: Number(query.customerId),
      });
    }
    if (query.salesUserId) {
      qb.andWhere('o.salesUserId = :salesUserId', {
        salesUserId: query.salesUserId,
      });
    }
    if (query.dateFrom) {
      qb.andWhere('o.orderDate >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('o.orderDate <= :dateTo', { dateTo: query.dateTo });
    }
    if (query.search) {
      qb.andWhere(
        '(o.orderNo ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortBy, sortDir)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return ResponseHelper.success(
      {
        items: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      'OK',
    );
  }

  private async findOneEntity(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException('ไม่พบออเดอร์');
    }
    const [history, approvals, stockMovements] = await Promise.all([
      this.historyRepo.find({
        where: { orderId: id },
        order: { changedAt: 'ASC' },
      }),
      this.approvalRepo.find({
        where: { orderId: id },
        order: { decidedAt: 'ASC' },
      }),
      this.inventoryService.listMovementsByOrder(id),
    ]);
    return { ...order, history, approvals, stockMovements };
  }

  private async loadOrderWithItems(id: string): Promise<SalesOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('ไม่พบออเดอร์');
    }
    if (!order.items?.length) {
      throw new BadRequestException('ออเดอร์ไม่มีรายการสินค้า');
    }
    return order;
  }

  async findOne(id: string) {
    return ResponseHelper.success(await this.findOneEntity(id), 'OK');
  }

  async update(id: string, dto: UpdateOrderDto, username: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('ไม่พบออเดอร์');
    }
    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        'แก้ไขได้เฉพาะออเดอร์สถานะ DRAFT หรือ PENDING',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.customerId !== undefined) order.customerId = dto.customerId;
      if (dto.salesChannel !== undefined) order.salesChannel = dto.salesChannel;
      if (dto.orderDate !== undefined) order.orderDate = dto.orderDate;
      if (dto.requiredDate !== undefined) order.requiredDate = dto.requiredDate;
      if (dto.deliveryDate !== undefined) order.deliveryDate = dto.deliveryDate;
      if (dto.note !== undefined) order.note = dto.note;
      order.updateBy = username || null;

      if (dto.items) {
        const totals = this.computeTotals(dto.items);
        await manager.delete(OrderItem, { orderId: id });
        const items = totals.lines.map((line) =>
          manager.create(OrderItem, {
            orderId: id,
            productId: line.productId,
            quantity: String(line.quantity),
            unitPrice: line.price.toFixed(2),
            discount: line.discount.toFixed(2),
            lineTotal: line.lineTotal.toFixed(2),
          }),
        );
        await manager.save(items);
        order.subtotal = totals.subtotal.toFixed(2);
        order.discountTotal = totals.discountTotal.toFixed(2);
        order.grandTotal = totals.grandTotal.toFixed(2);
      }

      await manager.save(order);
    });

    return ResponseHelper.success(await this.findOneEntity(id), 'อัปเดตออเดอร์สำเร็จ');
  }

  /** ส่งคำขอขายสินค้า: DRAFT -> PENDING */
  async submit(id: string, username: string) {
    return this.applyTransition(id, 'PENDING', username, 'ส่งคำขอขายสินค้า');
  }

  /** รายการรออนุมัติ */
  async findPendingApprovals(query: QueryOrdersDto) {
    return this.findAll({ ...query, status: 'PENDING' });
  }

  /** อนุมัติ: PENDING -> APPROVED + จองสต็อก */
  async approve(id: string, username: string, approverId: string) {
    const order = await this.loadOrderWithItems(id);
    if (order.status !== 'PENDING') {
      throw new BadRequestException('อนุมัติได้เฉพาะออเดอร์สถานะรออนุมัติ');
    }
    await this.applyTransition(
      id,
      'APPROVED',
      username,
      'อนุมัติออเดอร์',
      async (manager) => {
        await this.inventoryService.reserveForOrder(
          manager,
          id,
          order.orderNo,
          order.items,
          username,
        );
        await manager.save(
          manager.create(OrderApproval, {
            orderId: id,
            decision: 'APPROVED',
            reason: null,
            approverId,
          }),
        );
      },
    );
    return ResponseHelper.success(
      await this.findOneEntity(id),
      'อนุมัติออเดอร์สำเร็จ',
    );
  }

  /** ปฏิเสธ: PENDING -> CANCELLED */
  async reject(
    id: string,
    dto: RejectOrderDto,
    username: string,
    approverId: string,
  ) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('ปฏิเสธได้เฉพาะออเดอร์สถานะรออนุมัติ');
    }
    await this.applyTransition(
      id,
      'CANCELLED',
      username,
      `ปฏิเสธ: ${dto.reason}`,
      async (manager) => {
        await manager.save(
          manager.create(OrderApproval, {
            orderId: id,
            decision: 'REJECTED',
            reason: dto.reason,
            approverId,
          }),
        );
      },
    );
    return ResponseHelper.success(
      await this.findOneEntity(id),
      'ปฏิเสธออเดอร์แล้ว',
    );
  }

  /** ยกเลิกออเดอร์ (คืนสต็อกถ้าเคยจองแล้ว) */
  async cancel(id: string, dto: CancelOrderDto, username: string) {
    const order = await this.loadOrderWithItems(id);
    const cancellable: SalesOrderStatus[] = [
      'DRAFT',
      'PENDING',
      'APPROVED',
      'PROCESSING',
    ];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException(
        `ไม่สามารถยกเลิกออเดอร์สถานะ ${order.status}`,
      );
    }
    const releaseStock = requiresStockRelease(order.status);
    await this.applyTransition(
      id,
      'CANCELLED',
      username,
      dto.reason ?? 'ยกเลิกออเดอร์',
      releaseStock
        ? async (manager) => {
            await this.inventoryService.releaseForOrder(
              manager,
              id,
              order.orderNo,
              order.items,
              username,
              dto.reason,
            );
          }
        : undefined,
    );
    return ResponseHelper.success(
      await this.findOneEntity(id),
      'ยกเลิกออเดอร์แล้ว',
    );
  }

  /** เลื่อนสถานะฝั่งคลัง: PROCESSING / SHIPPING / COMPLETED */
  async advanceStatus(
    id: string,
    dto: TransitionOrderStatusDto,
    username: string,
  ) {
    const order = await this.loadOrderWithItems(id);
    if (!canTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `ไม่สามารถเปลี่ยนจาก ${order.status} เป็น ${dto.status}`,
      );
    }

    const note = dto.note ?? `เปลี่ยนสถานะเป็น ${dto.status}`;

    await this.applyTransition(
      id,
      dto.status,
      username,
      note,
      async (manager) => {
        if (shipsStockOnEnter(dto.status)) {
          await this.inventoryService.shipForOrder(
            manager,
            id,
            order.orderNo,
            order.items,
            username,
          );
        }
      },
    );

    return ResponseHelper.success(
      await this.findOneEntity(id),
      'อัปเดตสถานะสำเร็จ',
    );
  }

  private async applyTransition(
    id: string,
    to: SalesOrderStatus,
    username: string,
    reason: string,
    beforeSave?: (manager: import('typeorm').EntityManager) => Promise<void>,
  ) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('ไม่พบออเดอร์');
    }
    if (!canTransition(order.status, to)) {
      throw new BadRequestException(
        `ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น ${to}`,
      );
    }
    const from = order.status;

    await this.dataSource.transaction(async (manager) => {
      if (beforeSave) {
        await beforeSave(manager);
      }
      order.status = to;
      order.updateBy = username || null;
      await manager.save(order);
      await manager.save(
        manager.create(OrderStatusHistory, {
          orderId: id,
          fromStatus: from,
          toStatus: to,
          reason,
          changedBy: username || null,
        }),
      );
    });
  }

  async remove(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('ไม่พบออเดอร์');
    }
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('ลบได้เฉพาะออเดอร์สถานะ DRAFT');
    }
    await this.orderRepo.delete({ id });
    return ResponseHelper.success({ id }, 'ลบออเดอร์สำเร็จ');
  }

  async exportToExcel(query: QueryOrdersDto): Promise<Buffer> {
    const page = 1;
    const pageSize = 10000; // Export all

    const sortColumnMap: Record<string, string> = {
      orderNo: 'o.orderNo',
      orderDate: 'o.orderDate',
      deliveryDate: 'o.deliveryDate',
      grandTotal: 'o.grandTotal',
      status: 'o.status',
      createDate: 'o.createDate',
    };
    const sortBy = sortColumnMap[query.sortBy ?? 'createDate'] ?? 'o.createDate';
    const sortDir = query.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere('o.customerId = :customerId', {
        customerId: Number(query.customerId),
      });
    }
    if (query.salesUserId) {
      qb.andWhere('o.salesUserId = :salesUserId', {
        salesUserId: query.salesUserId,
      });
    }
    if (query.dateFrom) {
      qb.andWhere('o.orderDate >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('o.orderDate <= :dateTo', { dateTo: query.dateTo });
    }
    if (query.search) {
      qb.andWhere(
        '(o.orderNo ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortBy, sortDir).take(pageSize);

    const orders = await qb.getMany();

    // Transform to Excel format
    const data = orders.flatMap((order) =>
      order.items.map((item) => ({
        'เลขออเดอร์': order.orderNo,
        'วันที่สร้าง': order.orderDate,
        'ลูกค้า': order.customer?.name || '',
        'รหัสลูกค้า': order.customer?.code || '',
        'สถานะ': order.status,
        'ช่องทางขาย': order.salesChannel || '',
        'วันที่ต้องการ': order.requiredDate || '',
        'วันที่จัดส่ง': order.deliveryDate || '',
        'รหัสสินค้า': item.product?.productCode || '',
        'ชื่อสินค้า': item.product?.productName || '',
        'จำนวน': parseFloat(item.quantity),
        'ราคาต่อหน่วย': parseFloat(item.unitPrice),
        'ส่วนลด': parseFloat(item.discount),
        'ยอดรวมรายการ': parseFloat(item.lineTotal),
        'ยอดรวมออเดอร์': parseFloat(order.grandTotal),
        'หมายเหตุ': order.note || '',
      })),
    );

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportToPDF(query: QueryOrdersDto): Promise<Buffer> {
    const page = 1;
    const pageSize = 10000;

    const sortColumnMap: Record<string, string> = {
      orderNo: 'o.orderNo',
      orderDate: 'o.orderDate',
      deliveryDate: 'o.deliveryDate',
      grandTotal: 'o.grandTotal',
      status: 'o.status',
      createDate: 'o.createDate',
    };
    const sortBy = sortColumnMap[query.sortBy ?? 'createDate'] ?? 'o.createDate';
    const sortDir = query.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere('o.customerId = :customerId', {
        customerId: Number(query.customerId),
      });
    }
    if (query.salesUserId) {
      qb.andWhere('o.salesUserId = :salesUserId', {
        salesUserId: query.salesUserId,
      });
    }
    if (query.dateFrom) {
      qb.andWhere('o.orderDate >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('o.orderDate <= :dateTo', { dateTo: query.dateTo });
    }
    if (query.search) {
      qb.andWhere(
        '(o.orderNo ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortBy, sortDir).take(pageSize);

    const orders = await qb.getMany();

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Sales Orders Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString('th-TH')}`, { align: 'center' });
    doc.moveDown();

    // Summary
    const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.grandTotal), 0);
    doc.fontSize(12).font('Helvetica-Bold').text(`Total Orders: ${orders.length}`);
    doc.text(`Total Sales: ${totalSales.toFixed(2)} THB`);
    doc.moveDown();

    // Orders table
    orders.forEach((order, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Order header
      doc.fontSize(14).font('Helvetica-Bold').text(`Order #${order.orderNo}`);
      doc.fontSize(10).font('Helvetica').text(`Customer: ${order.customer?.name || 'N/A'}`);
      doc.text(`Date: ${order.orderDate}`);
      doc.text(`Status: ${order.status}`);
      doc.text(`Total: ${parseFloat(order.grandTotal).toFixed(2)} THB`);
      doc.moveDown();

      // Items table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Product', 50, doc.y, { width: 150 });
      doc.text('Qty', 200, doc.y);
      doc.text('Price', 250, doc.y);
      doc.text('Discount', 300, doc.y);
      doc.text('Total', 380, doc.y);
      doc.moveDown();

      // Items
      doc.font('Helvetica');
      order.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.product?.productName || 'N/A', 50, y, { width: 150 });
        doc.text(item.quantity, 200, y);
        doc.text(parseFloat(item.unitPrice).toFixed(2), 250, y);
        doc.text(parseFloat(item.discount).toFixed(2), 300, y);
        doc.text(parseFloat(item.lineTotal).toFixed(2), 380, y);
        doc.moveDown(0.5);
      });

      if (order.note) {
        doc.moveDown();
        doc.font('Helvetica-Oblique').text(`Note: ${order.note}`);
        doc.font('Helvetica');
      }
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
