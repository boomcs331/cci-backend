import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionOrder, ProductionLot, ProductionProcess, ProductionLotTracking } from './entities';
import { Product } from '../products/entities/product.entity';
import { CreateProductionOrderDto, StartProcessDto, CompleteProcessDto, CreateProcessDto } from './dto';

@Injectable()
export class ProductionOrdersService {
  constructor(
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
    @InjectRepository(ProductionLot)
    private lotRepo: Repository<ProductionLot>,
    @InjectRepository(ProductionProcess)
    private processRepo: Repository<ProductionProcess>,
    @InjectRepository(ProductionLotTracking)
    private trackingRepo: Repository<ProductionLotTracking>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async createProductionOrder(dto: CreateProductionOrderDto, user: string) {
    return await this.dataSource.transaction(async manager => {
      const product = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Product not found');

      const lotSize = product.lotSize || 100;
      const totalLots = Math.ceil(dto.orderQuantity / lotSize);

      const orderNo = await this.generateOrderNo();

      const order = manager.create(ProductionOrder, {
        orderNo,
        productId: dto.productId,
        orderQuantity: dto.orderQuantity,
        lotSize,
        totalLots,
        status: 'DRAFT',
        remarks: dto.remarks,
        createBy: user,
      });
      const savedOrder = await manager.save(order);

      const today = new Date();
      const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');

      for (let i = 0; i < totalLots; i++) {
        const seqNo = i + 1;
        const lotNo = `${orderNo}-LOT${String(seqNo).padStart(3, '0')}`;
        const qrCode = `QR-${lotNo}-${Date.now() + i}`;
        const quantity = i === totalLots - 1 
          ? dto.orderQuantity - (lotSize * (totalLots - 1))
          : lotSize;

        const lot = manager.create(ProductionLot, {
          orderId: savedOrder.id,
          lotNo,
          qrCode,
          sequenceNo: seqNo,
          quantity,
          status: 'PENDING',
        });
        await manager.save(lot);
      }

      return this.findOrderWithLots(savedOrder.id);
    });
  }

  async findAllOrders(page = 1, limit = 10) {
    const [orders, total] = await this.orderRepo.findAndCount({
      relations: ['product', 'lots'],
      order: { createDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOrderWithLots(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['product', 'lots', 'lots.currentProcess'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async startOrder(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Order already started');
    }

    order.status = 'IN_PROGRESS';
    return this.orderRepo.save(order);
  }

  async startLotProcess(qrCode: string, dto: StartProcessDto) {
    return await this.dataSource.transaction(async manager => {
      const lot = await manager.findOne(ProductionLot, { where: { qrCode } });
      if (!lot) throw new NotFoundException('QR Code not found');

      const process = await manager.findOne(ProductionProcess, { where: { id: dto.processId } });
      if (!process) throw new NotFoundException('Process not found');

      const tracking = manager.create(ProductionLotTracking, {
        lotId: lot.id,
        processId: dto.processId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        operator: dto.operator,
      });
      await manager.save(tracking);

      lot.currentProcessId = dto.processId;
      lot.status = 'IN_PROGRESS';
      await manager.save(lot);

      return tracking;
    });
  }

  async completeLotProcess(qrCode: string, dto: CompleteProcessDto) {
    return await this.dataSource.transaction(async manager => {
      const lot = await manager.findOne(ProductionLot, { where: { qrCode } });
      if (!lot) throw new NotFoundException('QR Code not found');

      const tracking = await manager.findOne(ProductionLotTracking, {
        where: { lotId: lot.id, processId: dto.processId, status: 'IN_PROGRESS' }
      });
      if (!tracking) throw new NotFoundException('Process not started');

      tracking.endTime = new Date();
      tracking.status = 'COMPLETED';
      tracking.remarks = dto.remarks;
      await manager.save(tracking);

      const allProcesses = await manager.find(ProductionProcess, {
        where: { isActive: true },
        order: { sequenceOrder: 'ASC' }
      });
      const currentIndex = allProcesses.findIndex(p => p.id === dto.processId);
      
      if (currentIndex === allProcesses.length - 1) {
        lot.status = 'COMPLETED';
        lot.currentProcessId = undefined;
      } else {
        lot.currentProcessId = allProcesses[currentIndex + 1].id;
      }
      await manager.save(lot);

      return tracking;
    });
  }

  async getLotStatus(qrCode: string) {
    const lot = await this.lotRepo.findOne({
      where: { qrCode },
      relations: ['order', 'order.product', 'currentProcess', 'tracking', 'tracking.process']
    });
    if (!lot) throw new NotFoundException('QR Code not found');

    return {
      lotNo: lot.lotNo,
      qrCode: lot.qrCode,
      quantity: lot.quantity,
      status: lot.status,
      orderNo: lot.order.orderNo,
      productCode: lot.order.product.productCode,
      productName: lot.order.product.productName,
      currentProcess: lot.currentProcess?.processName,
      tracking: lot.tracking.map(t => ({
        processCode: t.process.processCode,
        processName: t.process.processName,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        operator: t.operator,
        remarks: t.remarks,
        duration: t.endTime && t.startTime 
          ? Math.round((t.endTime.getTime() - t.startTime.getTime()) / 60000) + ' นาที'
          : null
      }))
    };
  }

  async createProcess(dto: CreateProcessDto) {
    const process = this.processRepo.create(dto);
    return this.processRepo.save(process);
  }

  async getAllProcesses() {
    return this.processRepo.find({
      where: { isActive: true },
      order: { sequenceOrder: 'ASC' }
    });
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `PO${year}${month}`;

    const lastOrder = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.orderNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.orderNo', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNo.slice(-4));
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
