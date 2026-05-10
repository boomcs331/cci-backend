import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { buildInventoryStyleQrCode } from '@app/common';
import { ProductProductionStep } from '../products/entities/product-production-step.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  ProductionOrder,
  ProductionLot,
  ProductionProcess,
  ProductionLotTracking,
} from './entities';
import { Product } from '../products/entities/product.entity';
import { ProductStockService } from '../products/product-stock.service';
import {
  QrScanAction,
  QrScanDomain,
} from '../../core/audit/entities/qr-scan-log.entity';
import { QrScanLogService } from '../../core/audit/services/qr-scan-log.service';
import {
  CreateProductionOrderDto,
  StartProcessDto,
  CompleteProcessDto,
  CreateProcessDto,
  SplitLotDto,
} from './dto';
import { AuthUserService } from '../auth/services/auth-user.service';
import { User } from '../auth/entities/user.entity';

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
    private readonly productStockService: ProductStockService,
    private readonly authUserService: AuthUserService,
    private readonly qrScanLogService: QrScanLogService,
  ) {}

  private userIsAdminGlobal(user: User | null | undefined): boolean {
    if (!user) return false;
    const fromDirect = user.roles?.some((r) => r.code === 'ADMIN_GLOBAL');
    if (fromDirect) return true;
    return (
      user.roleAssignments?.some((a) => a.role?.code === 'ADMIN_GLOBAL') ??
      false
    );
  }

  private canUserActOnProcess(
    process: ProductionProcess,
    user: User | null,
    isGlobal: boolean,
  ): boolean {
    if (isGlobal) return true;
    const allowed = process.allowedDepartmentCodes;
    if (!allowed?.length) return true;
    const code = user?.department?.code;
    if (!code) return false;
    return allowed.includes(code);
  }

  private async resolveOrderedProcesses(
    manager: EntityManager,
    productId: number,
  ): Promise<ProductionProcess[]> {
    const route = await manager.find(ProductProductionStep, {
      where: { productId },
      relations: ['process'],
      order: { stepOrder: 'ASC' },
    });
    if (route.length > 0) {
      return route.map((r) => r.process);
    }
    return manager.find(ProductionProcess, {
      where: { isActive: true },
      order: { sequenceOrder: 'ASC' },
    });
  }

  private processStationFields(p: ProductionProcess) {
    return {
      processId: p.id,
      processCode: p.processCode,
      processName: p.processName,
      allowedDepartmentCodes: p.allowedDepartmentCodes ?? null,
    };
  }

  /** Shared: step position, department gates, Thai summary / alerts for QR status & station */
  private async buildLotQrStationView(lot: ProductionLot, userId?: string) {
    const user = userId
      ? await this.authUserService.findUserById(userId)
      : null;
    const isGlobal = this.userIsAdminGlobal(user);
    const userDept = user?.department?.code ?? null;

    const orderedProcesses = await this.resolveOrderedProcesses(
      this.dataSource.manager,
      lot.order.productId,
    );

    const route = orderedProcesses.map((p) => this.processStationFields(p));

    const inProgressRow = lot.tracking?.find((t) => t.status === 'IN_PROGRESS');
    const inProgress = inProgressRow?.process
      ? {
          ...this.processStationFields(inProgressRow.process),
          startTime: inProgressRow.startTime,
        }
      : null;

    type StationProc = ReturnType<
      ProductionOrdersService['processStationFields']
    >;
    let expectedProcess: StationProc | null = null;
    if (lot.status !== 'COMPLETED' && !inProgress) {
      const expectedId =
        lot.currentProcessId ?? orderedProcesses[0]?.id ?? null;
      const proc = expectedId
        ? orderedProcesses.find((x) => x.id === expectedId)
        : null;
      expectedProcess = proc ? this.processStationFields(proc) : null;
    }

    const expectedProcEntity = expectedProcess
      ? orderedProcesses.find((x) => x.id === expectedProcess.processId)
      : null;
    const inProgEntity = inProgressRow?.process ?? null;

    const canStart = Boolean(
      expectedProcEntity &&
        !inProgress &&
        lot.status !== 'COMPLETED' &&
        this.canUserActOnProcess(expectedProcEntity, user, isGlobal),
    );

    const canComplete = Boolean(
      inProgEntity &&
        this.canUserActOnProcess(inProgEntity, user, isGlobal),
    );

    let denyReason: string | null = null;
    let departmentAlertTh: string | null = null;

    if (lot.status !== 'COMPLETED' && !inProgress && expectedProcEntity) {
      if (!canStart && !isGlobal) {
        const need = expectedProcEntity.allowedDepartmentCodes?.length
          ? expectedProcEntity.allowedDepartmentCodes.join(', ')
          : null;
        if (need) {
          denyReason = `Step ${expectedProcEntity.processCode} requires department: ${need}. Yours: ${userDept ?? 'none'}`;
          departmentAlertTh =
            '\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19: \u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19 "' +
            expectedProcEntity.processCode +
            '" (' +
            expectedProcEntity.processName +
            ') \u0e01\u0e33\u0e2b\u0e19\u0e14\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e41\u0e1c\u0e19\u0e01 ' +
            need +
            ' \u0e41\u0e1c\u0e19\u0e01\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e04\u0e37\u0e2d "' +
            (userDept ?? '\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e23\u0e30\u0e1a\u0e38') +
            '" \u2014 \u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e40\u0e23\u0e34\u0e48\u0e21\u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e2a\u0e16\u0e32\u0e19\u0e35\u0e19\u0e35\u0e49\u0e44\u0e14\u0e49';
        }
      }
    } else if (inProgEntity && !canComplete && !isGlobal) {
      const need = inProgEntity.allowedDepartmentCodes?.length
        ? inProgEntity.allowedDepartmentCodes.join(', ')
        : null;
      if (need) {
        denyReason = `Complete allowed for departments: ${need}. Yours: ${userDept ?? 'none'}`;
        departmentAlertTh =
          '\u0e41\u0e08\u0e49\u0e07\u0e40\u0e15\u0e37\u0e2d\u0e19: \u0e01\u0e32\u0e23\u0e1b\u0e34\u0e14\u0e07\u0e32\u0e19\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19 "' +
          inProgEntity.processCode +
          '" (' +
          inProgEntity.processName +
          ') \u0e01\u0e33\u0e2b\u0e19\u0e14\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e41\u0e1c\u0e19\u0e01 ' +
          need +
          ' \u0e41\u0e1c\u0e19\u0e01\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e04\u0e37\u0e2d "' +
          (userDept ?? '\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e23\u0e30\u0e1a\u0e38') +
          '" \u2014 \u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e1b\u0e34\u0e14\u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e2a\u0e16\u0e32\u0e19\u0e35\u0e19\u0e35\u0e49\u0e44\u0e14\u0e49';
      }
    }


    let currentStepPhase: 'IN_PROGRESS' | 'WAITING_START' | 'COMPLETED';
    if (lot.status === 'COMPLETED') {
      currentStepPhase = 'COMPLETED';
    } else if (inProgress) {
      currentStepPhase = 'IN_PROGRESS';
    } else {
      currentStepPhase = 'WAITING_START';
    }

    let stepSummaryTh: string;
    if (lot.status === 'COMPLETED') {
      stepSummaryTh =
        '\u0e1c\u0e25\u0e34\u0e15\u0e04\u0e23\u0e1a\u0e41\u0e25\u0e49\u0e27 \u2014 \u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19\u0e16\u0e31\u0e14\u0e44\u0e1b';
    } else if (orderedProcesses.length === 0) {
      stepSummaryTh =
        '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e40\u0e2a\u0e49\u0e19\u0e17\u0e32\u0e07\u0e01\u0e23\u0e30\u0e1a\u0e27\u0e19\u0e01\u0e32\u0e23\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e19\u0e35\u0e49 \u2014 \u0e01\u0e33\u0e2b\u0e19\u0e14\u0e25\u0e33\u0e14\u0e31\u0e1a\u0e02\u0e31\u0e49\u0e19\u0e1a\u0e19\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e01\u0e48\u0e2d\u0e19';
    } else if (inProgress) {
      stepSummaryTh = `\u0e01\u0e33\u0e25\u0e31\u0e07\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19 ${inProgress.processCode} \u2014 ${inProgress.processName}`;
    } else if (expectedProcess) {
      stepSummaryTh = `\u0e23\u0e2d\u0e40\u0e23\u0e34\u0e48\u0e21\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19 ${expectedProcess.processCode} \u2014 ${expectedProcess.processName}`;
    } else {
      stepSummaryTh =
        '\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e23\u0e30\u0e1a\u0e38\u0e02\u0e31\u0e49\u0e19\u0e15\u0e2d\u0e19\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19\u0e44\u0e14\u0e49';
    }

    return {
      lotNo: lot.lotNo,
      qrCode: lot.qrCode,
      quantity: lot.quantity,
      status: lot.status,
      orderNo: lot.order.orderNo,
      productCode: lot.order.product.productCode,
      productName: lot.order.product.productName,
      userDepartmentCode: userDept,
      isAdminGlobal: isGlobal,
      route,
      inProgress,
      expectedProcess,
      currentStepPhase,
      stepSummaryTh,
      departmentAlertTh,
      nextAction: inProgress
        ? ('complete' as const)
        : lot.status === 'COMPLETED'
          ? ('none' as const)
          : ('start' as const),
      canStart,
      canComplete,
      completeProcessId: inProgress?.processId ?? null,
      denyReason: departmentAlertTh ?? denyReason,
    };
  }

  async createProductionOrder(dto: CreateProductionOrderDto, user: string) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Product not found');

      const orderQty = Number(dto.orderQuantity);

      const lotSize =
        dto.lotSize && dto.lotSize > 0
          ? dto.lotSize
          : product.lotSize && product.lotSize > 0
            ? product.lotSize
            : 100;
      const totalLots = Math.ceil(orderQty / lotSize);

      const orderNo = await this.generateOrderNo();

      const order = manager.create(ProductionOrder, {
        orderNo,
        productId: dto.productId,
        orderQuantity: orderQty,
        quantity: orderQty,
        lotSize,
        totalLots,
        status: 'DRAFT',
        remarks: dto.remarks,
        createBy: user,
        planId: dto.planId,
        planItemId: dto.planItemId,
      });
      const savedOrder = await manager.save(order);

      // เลขล็อตแบบเดียวกับ material: PG = ล็อตผลิตรายวัน (เทียบ PC), PD = คู่วันเดียวกัน (เทียบ lot_pd_no)
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const dateStr = `${y}${m}${d}`;
      const startOfDay = new Date(y, now.getMonth(), now.getDate());
      const endOfDay = new Date(y, now.getMonth(), now.getDate() + 1);

      const existingPgCount = await manager
        .createQueryBuilder(ProductionLot, 'lot')
        .where('lot.lotNo LIKE :prefix', { prefix: `PG${dateStr}-%` })
        .andWhere('lot.createDate >= :startOfDay', { startOfDay })
        .andWhere('lot.createDate < :endOfDay', { endOfDay })
        .getCount();

      const existingPdCount = await manager
        .createQueryBuilder(ProductionLot, 'lot')
        .where('lot.lotPdNo IS NOT NULL')
        .andWhere('lot.lotPdNo LIKE :prefix', { prefix: `PD${dateStr}-%` })
        .andWhere('lot.createDate >= :startOfDay', { startOfDay })
        .andWhere('lot.createDate < :endOfDay', { endOfDay })
        .getCount();

      // ตั้งค่า "ขั้นตอนแรก" ให้ล็อตใหม่ทันทีหลังสร้าง QR
      // เพื่อให้หน้า tracking แสดงว่าล็อตรอเริ่มที่สถานีแรกทันที
      const orderedProcesses = await this.resolveOrderedProcesses(
        manager,
        dto.productId,
      );
      const firstProcessId = orderedProcesses[0]?.id;

      for (let i = 0; i < totalLots; i++) {
        const seqNo = i + 1;
        const pgRun = String(existingPgCount + i + 1).padStart(3, '0');
        const pdRun = String(existingPdCount + i + 1).padStart(3, '0');
        const lotNo = `PG${dateStr}-${pgRun}`;
        const lotPdNo = `PD${dateStr}-${pdRun}`;
        const orderLotLabel = `${orderNo}-LOT${String(seqNo).padStart(3, '0')}`;
        const qrCode = buildInventoryStyleQrCode(lotNo);
        const quantity =
          i === totalLots - 1 ? orderQty - lotSize * (totalLots - 1) : lotSize;

        const lot = manager.create(ProductionLot, {
          orderId: savedOrder.id,
          lotNo,
          lotPdNo,
          orderLotLabel,
          orderNoRef: savedOrder.orderNo,
          qrCode,
          sequenceNo: seqNo,
          quantity,
          status: 'PENDING',
          currentProcessId: firstProcessId,
        });
        await manager.save(lot);
      }

      // ต้องโหลดด้วย transaction manager — ห้ามใช้ this.orderRepo ใน callback เพราะจะไม่เห็นแถวที่ยังไม่ commit แล้ว NotFound → rollback ทั้ง order
      const full = await manager.findOne(ProductionOrder, {
        where: { id: savedOrder.id },
        relations: [
          'product',
          'lots',
          'lots.currentProcess',
          'plan',
          'planItem',
        ],
      });
      if (!full) throw new NotFoundException('Order not found');
      return full;
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
      relations: [
        'product',
        'product.customer',
        'lots',
        'lots.currentProcess',
        'plan',
        'planItem',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** ใช้ซ้ำสร้าง QR จากแผน: ถ้ามี order ของ plan + บรรทัดแผนแล้ว ไม่สร้างซ้ำ */
  async findOrderByPlanAndPlanItem(
    planId: number,
    planItemId: number,
  ): Promise<ProductionOrder | null> {
    if (!planId || !planItemId) return null;
    return this.orderRepo.findOne({ where: { planId, planItemId } });
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

  async startLotProcess(
    qrCode: string,
    dto: StartProcessDto,
    userId?: string,
  ) {
    const user = userId
      ? await this.authUserService.findUserById(userId)
      : null;
    const isGlobal = this.userIsAdminGlobal(user);

    return await this.dataSource.transaction(async (manager) => {
      const lot = await manager.findOne(ProductionLot, {
        where: { qrCode },
        relations: ['order'],
      });
      if (!lot) throw new NotFoundException('QR Code not found');
      if (lot.status === 'SPLIT') {
        throw new BadRequestException(
          'This QR has been split and retired. Please scan a child lot QR.',
        );
      }

      if (lot.status === 'COMPLETED') {
        throw new BadRequestException('Lot production is already completed');
      }

      const openTracking = await manager.findOne(ProductionLotTracking, {
        where: { lotId: lot.id, status: 'IN_PROGRESS' },
      });
      if (openTracking) {
        throw new BadRequestException(
          'A step is already in progress; complete it before starting another',
        );
      }

      const process = await manager.findOne(ProductionProcess, {
        where: { id: dto.processId },
      });
      if (!process) throw new NotFoundException('Process not found');

      const orderedProcesses = await this.resolveOrderedProcesses(
        manager,
        lot.order.productId,
      );
      if (orderedProcesses.length === 0) {
        throw new BadRequestException(
          'No production route is configured for this product',
        );
      }

      const allowedIds = orderedProcesses.map((p) => p.id);
      if (!allowedIds.includes(dto.processId)) {
        throw new BadRequestException(
          "ขั้นตอนนี้ไม่อยู่ในเส้นทางผลิตที่กำหนดสำหรับสินค้านี้",
        );
      }

      const expectedProcessId =
        lot.currentProcessId ?? orderedProcesses[0].id;
      if (dto.processId !== expectedProcessId) {
        const expected = orderedProcesses.find(
          (p) => p.id === expectedProcessId,
        );
        throw new BadRequestException(
          `Wrong step: expected ${expected?.processCode ?? expectedProcessId}, got process id ${dto.processId}`,
        );
      }

      if (!this.canUserActOnProcess(process, user, isGlobal)) {
        throw new ForbiddenException(
          'Your department is not allowed to start this step',
        );
      }

      const operator =
        (dto.operator && dto.operator.trim()) ||
        user?.username ||
        'scanner';

      const tracking = manager.create(ProductionLotTracking, {
        lotId: lot.id,
        processId: dto.processId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        operator,
      });
      await manager.save(tracking);

      lot.currentProcessId = dto.processId;
      lot.status = 'IN_PROGRESS';
      await manager.save(lot);

      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STEP_START,
        qrCode,
        userId: userId ?? null,
        username: user?.username ?? null,
        departmentId: user?.department?.id
          ? String(user.department.id)
          : null,
        isSuccess: true,
        metadata: {
          processId: dto.processId,
          operator,
        },
      });

      return tracking;
    }).catch(async (err: unknown) => {
      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STEP_START,
        qrCode,
        userId: userId ?? null,
        username: user?.username ?? null,
        departmentId: user?.department?.id
          ? String(user.department.id)
          : null,
        isSuccess: false,
        errorMessage: err instanceof Error ? err.message : String(err),
        metadata: { processId: dto.processId },
      });
      throw err;
    });
  }

  async completeLotProcess(
    qrCode: string,
    dto: CompleteProcessDto,
    userId?: string,
  ) {
    const user = userId
      ? await this.authUserService.findUserById(userId)
      : null;
    const isGlobal = this.userIsAdminGlobal(user);

    return await this.dataSource.transaction(async (manager) => {
      const lot = await manager.findOne(ProductionLot, {
        where: { qrCode },
        relations: ['order'],
      });
      if (!lot) throw new NotFoundException('QR Code not found');
      if (lot.status === 'SPLIT') {
        throw new BadRequestException(
          'This QR has been split and retired. Please scan a child lot QR.',
        );
      }

      const tracking = await manager.findOne(ProductionLotTracking, {
        where: {
          lotId: lot.id,
          processId: dto.processId,
          status: 'IN_PROGRESS',
        },
        relations: ['process'],
      });
      if (!tracking) throw new NotFoundException('Process not started');

      const processRow =
        tracking.process ??
        (await manager.findOne(ProductionProcess, {
          where: { id: dto.processId },
        }));
      if (!processRow) throw new NotFoundException('Process not found');

      if (!this.canUserActOnProcess(processRow, user, isGlobal)) {
        throw new ForbiddenException(
          'Your department is not allowed to complete this step',
        );
      }

      tracking.endTime = new Date();
      tracking.status = 'COMPLETED';
      tracking.remarks = dto.remarks;
      await manager.save(tracking);

      const orderedProcesses = await this.resolveOrderedProcesses(
        manager,
        lot.order.productId,
      );

      const currentIndex = orderedProcesses.findIndex(
        (p) => p.id === dto.processId,
      );
      if (currentIndex === -1) {
        throw new BadRequestException(
          "ขั้นตอนนี้ไม่อยู่ในลำดับการผลิตของสินค้านี้",
        );
      }

      const prevLotStatus = lot.status;

      if (currentIndex === orderedProcesses.length - 1) {
        lot.status = 'COMPLETED';
        lot.currentProcessId = undefined;
      } else {
        lot.currentProcessId = orderedProcesses[currentIndex + 1].id;
      }
      await manager.save(lot);

      if (lot.status === 'COMPLETED' && prevLotStatus !== 'COMPLETED') {
        await this.productStockService.addFinishedGoodsFromLot(
          manager,
          lot.order.productId,
          lot.quantity,
        );
      }

      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STEP_COMPLETE,
        qrCode,
        userId: userId ?? null,
        username: user?.username ?? null,
        departmentId: user?.department?.id
          ? String(user.department.id)
          : null,
        isSuccess: true,
        metadata: {
          processId: dto.processId,
          lotStatus: lot.status,
        },
      });

      return tracking;
    }).catch(async (err: unknown) => {
      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STEP_COMPLETE,
        qrCode,
        userId: userId ?? null,
        username: user?.username ?? null,
        departmentId: user?.department?.id
          ? String(user.department.id)
          : null,
        isSuccess: false,
        errorMessage: err instanceof Error ? err.message : String(err),
        metadata: { processId: dto.processId },
      });
      throw err;
    });
  }

  async splitLot(qrCode: string, dto: SplitLotDto, userId?: string) {
    const user = userId ? await this.authUserService.findUserById(userId) : null;
    const code = this.normalizeLotLookupCode(qrCode);
    const moveReleasedToNextStep = dto.moveReleasedToNextStep !== false;

    return this.dataSource.transaction(async (manager) => {
      const lot = await manager.findOne(ProductionLot, {
        where: [{ qrCode: code }, { lotNo: code }],
        relations: ['order'],
      });
      if (!lot) throw new NotFoundException('QR Code not found');
      if (lot.status === 'SPLIT') {
        throw new BadRequestException(
          'This QR has been split already. Please scan a child lot QR.',
        );
      }
      if (lot.status === 'COMPLETED') {
        throw new BadRequestException('Completed lot cannot be split.');
      }

      const sourceQty = Number(lot.quantity);
      const releaseQty = Number(dto.releasedQuantity);
      if (!Number.isFinite(releaseQty) || releaseQty <= 0) {
        throw new BadRequestException('releasedQuantity must be greater than 0.');
      }
      if (releaseQty >= sourceQty) {
        throw new BadRequestException(
          'releasedQuantity must be less than source lot quantity.',
        );
      }
      const remainingQty = sourceQty - releaseQty;

      const orderedProcesses = await this.resolveOrderedProcesses(
        manager,
        lot.order.productId,
      );
      const currentProcessId = lot.currentProcessId ?? orderedProcesses[0]?.id;
      const currentIdx = orderedProcesses.findIndex((p) => p.id === currentProcessId);
      const nextProcessId =
        currentIdx >= 0 && currentIdx < orderedProcesses.length - 1
          ? orderedProcesses[currentIdx + 1]?.id
          : undefined;

      if (moveReleasedToNextStep && !nextProcessId) {
        throw new BadRequestException(
          'Cannot move released lot to next step because current step is the last step.',
        );
      }

      const openTracking = await manager.findOne(ProductionLotTracking, {
        where: { lotId: lot.id, status: 'IN_PROGRESS' },
      });

      const maxSeqRaw = await manager
        .createQueryBuilder(ProductionLot, 'lot')
        .select('COALESCE(MAX(lot.sequenceNo), 0)', 'maxSeq')
        .where('lot.orderId = :orderId', { orderId: lot.orderId })
        .getRawOne<{ maxseq?: string; maxSeq?: string }>();
      const maxSeq = Number(maxSeqRaw?.maxSeq ?? maxSeqRaw?.maxseq ?? 0);

      const splitCountRaw = await manager
        .createQueryBuilder(ProductionLot, 'lot')
        .where('lot.parentLotId = :parentLotId', { parentLotId: lot.id })
        .getCount();
      const splitRunA = splitCountRaw + 1;
      const splitRunB = splitCountRaw + 2;

      const childLotNoA = `${lot.lotNo}-S${String(splitRunA).padStart(2, '0')}`;
      const childLotNoB = `${lot.lotNo}-S${String(splitRunB).padStart(2, '0')}`;
      const childOrderLabelBase = lot.orderLotLabel ?? lot.lotNo;
      const childOrderLabelA = `${childOrderLabelBase}-S${String(splitRunA).padStart(2, '0')}`;
      const childOrderLabelB = `${childOrderLabelBase}-S${String(splitRunB).padStart(2, '0')}`;

      const operator =
        (dto.operator && dto.operator.trim()) || user?.username || 'scanner';
      const reason = (dto.reason && dto.reason.trim()) || 'split lot';

      const released = manager.create(ProductionLot, {
        orderId: lot.orderId,
        lotNo: childLotNoA,
        lotPdNo: lot.lotPdNo,
        orderLotLabel: childOrderLabelA,
        orderNoRef: lot.orderNoRef ?? lot.order?.orderNo ?? null,
        qrCode: buildInventoryStyleQrCode(childLotNoA),
        sequenceNo: maxSeq + 1,
        quantity: releaseQty,
        parentLotId: lot.id,
        splitReason: reason,
        currentProcessId: moveReleasedToNextStep ? nextProcessId : currentProcessId,
        status: moveReleasedToNextStep ? 'PENDING' : lot.status,
      });
      const remaining = manager.create(ProductionLot, {
        orderId: lot.orderId,
        lotNo: childLotNoB,
        lotPdNo: lot.lotPdNo,
        orderLotLabel: childOrderLabelB,
        orderNoRef: lot.orderNoRef ?? lot.order?.orderNo ?? null,
        qrCode: buildInventoryStyleQrCode(childLotNoB),
        sequenceNo: maxSeq + 2,
        quantity: remainingQty,
        parentLotId: lot.id,
        splitReason: reason,
        currentProcessId: currentProcessId,
        status: lot.status === 'PENDING' ? 'PENDING' : 'IN_PROGRESS',
      });

      const savedReleased = await manager.save(released);
      const savedRemaining = await manager.save(remaining);

      if (currentProcessId) {
        if (moveReleasedToNextStep) {
          const completeRow = manager.create(ProductionLotTracking, {
            lotId: savedReleased.id,
            processId: currentProcessId,
            startTime: new Date(),
            endTime: new Date(),
            status: 'COMPLETED',
            operator,
            remarks: `auto-completed by split from ${lot.lotNo}`,
          });
          await manager.save(completeRow);
        } else if (lot.status === 'IN_PROGRESS') {
          const inProgRow = manager.create(ProductionLotTracking, {
            lotId: savedReleased.id,
            processId: currentProcessId,
            startTime: new Date(),
            status: 'IN_PROGRESS',
            operator,
            remarks: `split copy from ${lot.lotNo}`,
          });
          await manager.save(inProgRow);
        }

        if (lot.status === 'IN_PROGRESS') {
          const remRow = manager.create(ProductionLotTracking, {
            lotId: savedRemaining.id,
            processId: currentProcessId,
            startTime: openTracking?.startTime ?? new Date(),
            status: 'IN_PROGRESS',
            operator: openTracking?.operator ?? operator,
            remarks: `remaining from split of ${lot.lotNo}`,
          });
          await manager.save(remRow);
        }
      }

      lot.status = 'SPLIT';
      lot.currentProcessId = undefined;
      lot.splitReason = reason;
      if (!lot.orderNoRef) {
        lot.orderNoRef = lot.order?.orderNo ?? lot.orderNoRef;
      }
      await manager.save(lot);

      return {
        sourceLot: {
          id: lot.id,
          lotNo: lot.lotNo,
          orderNoRef: lot.orderNoRef ?? lot.order?.orderNo ?? null,
          qrCode: lot.qrCode,
          quantity: sourceQty,
          status: 'SPLIT',
          retired: true,
        },
        children: [
          {
            id: savedReleased.id,
            lotNo: savedReleased.lotNo,
            orderNoRef:
              savedReleased.orderNoRef ?? lot.orderNoRef ?? lot.order?.orderNo ?? null,
            qrCode: savedReleased.qrCode,
            quantity: Number(savedReleased.quantity),
            status: savedReleased.status,
            currentProcessId: savedReleased.currentProcessId ?? null,
          },
          {
            id: savedRemaining.id,
            lotNo: savedRemaining.lotNo,
            orderNoRef:
              savedRemaining.orderNoRef ?? lot.orderNoRef ?? lot.order?.orderNo ?? null,
            qrCode: savedRemaining.qrCode,
            quantity: Number(savedRemaining.quantity),
            status: savedRemaining.status,
            currentProcessId: savedRemaining.currentProcessId ?? null,
          },
        ],
      };
    });
  }

  async getLotStation(qrCode: string, userId?: string) {
    const code = this.normalizeLotLookupCode(qrCode);
    const lot = await this.lotRepo.findOne({
      where: [{ qrCode: code }, { lotNo: code }],
      relations: [
        'order',
        'order.product',
        'currentProcess',
        'tracking',
        'tracking.process',
      ],
    });
    if (!lot) {
      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STATION_LOOKUP,
        qrCode: code,
        userId: userId ?? null,
        isSuccess: false,
        errorMessage: 'QR Code not found',
      });
      throw new NotFoundException('QR Code not found');
    }
    if (lot.status === 'SPLIT') {
      throw new BadRequestException(
        'This QR has been split and retired. Please scan a child lot QR.',
      );
    }

    const station = await this.buildLotQrStationView(lot, userId);
    await this.qrScanLogService.logEvent({
      domain: QrScanDomain.PRODUCTION,
      action: QrScanAction.PRODUCTION_STATION_LOOKUP,
      qrCode: code,
      userId: userId ?? null,
      isSuccess: true,
      metadata: {
        lotStatus: lot.status,
        nextAction: station.nextAction,
      },
    });

    return station;
  }

  async getLotTracking(qrCode: string, userId?: string) {
    const code = this.normalizeLotLookupCode(qrCode);
    const lot = await this.lotRepo.findOne({
      where: [{ qrCode: code }, { lotNo: code }],
      relations: [
        'tracking',
        'tracking.process',
      ],
      order: {
        tracking: {
          startTime: 'ASC',
        },
      },
    });
    if (!lot) {
      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STATUS_LOOKUP,
        qrCode: code,
        userId: userId ?? null,
        isSuccess: false,
        errorMessage: 'QR Code not found',
      });
      throw new NotFoundException('QR Code not found');
    }
    if (lot.status === 'SPLIT') {
      throw new BadRequestException(
        'This QR has been split and retired. Please scan a child lot QR.',
      );
    }

    return (lot.tracking ?? []).map((t) => ({
      status: t.status,
      processCode: t.process?.processCode ?? null,
      processName: t.process?.processName ?? null,
      startTime: t.startTime ?? null,
      endTime: t.endTime ?? null,
      operator: t.operator ?? null,
      remarks: t.remarks ?? null,
    }));
  }

  async getLotLineage(qrCode: string, _userId?: string) {
    const code = this.normalizeLotLookupCode(qrCode);
    const lot = await this.lotRepo.findOne({
      where: [{ qrCode: code }, { lotNo: code }],
      relations: ['currentProcess', 'order', 'order.product'],
    });
    if (!lot) throw new NotFoundException('QR Code not found');

    const parent = lot.parentLotId
      ? await this.lotRepo.findOne({
          where: { id: lot.parentLotId },
          relations: ['currentProcess'],
        })
      : null;
    const children = await this.lotRepo.find({
      where: { parentLotId: lot.id },
      relations: ['currentProcess'],
      order: { id: 'ASC' },
    });

    const mapLot = (x: ProductionLot | null) =>
      x
        ? {
            id: x.id,
            lotNo: x.lotNo,
            orderNoRef: x.orderNoRef ?? null,
            qrCode: x.qrCode,
            quantity: Number(x.quantity),
            status: x.status,
            parentLotId: x.parentLotId ?? null,
            splitReason: x.splitReason ?? null,
            currentProcessCode: x.currentProcess?.processCode ?? null,
            currentProcessName: x.currentProcess?.processName ?? null,
          }
        : null;

    return {
      lot: mapLot(lot),
      parent: mapLot(parent),
      children: children.map((c) => mapLot(c)),
      order: {
        id: lot.order.id,
        orderNo: lot.order.orderNo,
        productCode: lot.order.product?.productCode ?? null,
        productName: lot.order.product?.productName ?? null,
      },
    };
  }

  async getInProgressLotsForMyDept(userId?: string) {
    const user = userId ? await this.authUserService.findUserById(userId) : null;
    const isGlobal = this.userIsAdminGlobal(user);

    const deptId = user?.department?.id ? String(user.department.id) : undefined;
    const deptCode = user?.department?.code ?? null;

    // For non-admin, we gate visibility by permissions:
    // - IN_PROGRESS list is part of the QR station workflow, so users must have either read or update.
    const canRead = userId
      ? await this.authUserService.hasPermission(
          String(userId),
          'production_orders.read',
          deptId,
        )
      : false;
    const canUpdate = userId
      ? await this.authUserService.hasPermission(
          String(userId),
          'production_orders.update',
          deptId,
        )
      : false;

    if (!isGlobal && !canRead && !canUpdate) {
      return [];
    }

    // Use production_lots as the source of truth.
    // Admin: show lots for *all statuses*.
    // Non-admin: show only lots that are IN_PROGRESS, and match department gates (allowedDepartmentCodes) for the current step.
    const qb = this.lotRepo
      .createQueryBuilder('lot')
      .innerJoin('lot.order', 'order')
      .innerJoin('order.product', 'product')
      .leftJoin('lot.currentProcess', 'process')
      .select([
        // Quote aliases so Postgres preserves camelCase in raw results.
        'lot.lotNo AS "lotNo"',
        'lot.qrCode AS "qrCode"',
        'lot.quantity AS "quantity"',
        'lot.status AS "status"',
        'order.orderNo AS "orderNo"',
        'product.productCode AS "productCode"',
        'product.productName AS "productName"',
        'process.processCode AS "currentProcessCode"',
        'process.processName AS "currentProcessName"',
        'process.allowedDepartmentCodes AS "allowedDepartmentCodes"',
      ])
      .orderBy('lot.createDate', 'DESC');

    if (isGlobal) {
      qb.where('lot.status != :splitStatus', { splitStatus: 'SPLIT' });
    } else {
      qb.where('lot.status = :status', { status: 'IN_PROGRESS' });
      // If user has no department, they can't be matched to department-gated processes.
      if (!deptCode) {
        return [];
      }
      qb.andWhere(
        '(process.id IS NULL OR process.allowedDepartmentCodes IS NULL OR :deptCode = ANY(process.allowedDepartmentCodes))',
        { deptCode },
      );
    }

    const rows = (await qb.getRawMany()) as Array<{
      lotNo: string;
      qrCode: string;
      quantity: number;
      status: string;
      orderNo: string;
      productCode: string;
      productName: string;
      currentProcessCode: string | null;
      currentProcessName: string | null;
      allowedDepartmentCodes: string[] | null;
    }>;

    return rows.map((r) => ({
      lotNo: r.lotNo,
      qrCode: r.qrCode,
      quantity: Number(r.quantity),
      status: r.status,
      orderNo: r.orderNo,
      productCode: r.productCode,
      productName: r.productName,
      currentProcessCode: r.currentProcessCode,
      currentProcessName: r.currentProcessName,
      allowedDepartmentCodes: r.allowedDepartmentCodes ?? null,
    }));
  }

  async getLotStatus(qrCode: string, userId?: string) {
    const code = this.normalizeLotLookupCode(qrCode);
    const lot = await this.lotRepo.findOne({
      where: [{ qrCode: code }, { lotNo: code }],
      relations: [
        'order',
        'order.product',
        'currentProcess',
        'tracking',
        'tracking.process',
      ],
    });
    if (!lot) {
      await this.qrScanLogService.logEvent({
        domain: QrScanDomain.PRODUCTION,
        action: QrScanAction.PRODUCTION_STATUS_LOOKUP,
        qrCode: code,
        userId: userId ?? null,
        isSuccess: false,
        errorMessage: 'QR Code not found',
      });
      throw new NotFoundException('QR Code not found');
    }
    if (lot.status === 'SPLIT') {
      throw new BadRequestException(
        'This QR has been split and retired. Please scan a child lot QR.',
      );
    }

    const station = await this.buildLotQrStationView(lot, userId);

    const payload = {
      lotNo: lot.lotNo,
      qrCode: lot.qrCode,
      quantity: lot.quantity,
      status: lot.status,
      orderNo: lot.order.orderNo,
      orderCreateDate: lot.order.createDate,
      productCode: lot.order.product.productCode,
      productName: lot.order.product.productName,
      currentProcess: lot.currentProcess?.processName ?? null,
      currentProcessCode: lot.currentProcess?.processCode ?? null,
      currentStepPhase: station.currentStepPhase,
      stepSummaryTh: station.stepSummaryTh,
      departmentAlertTh: station.departmentAlertTh,
      userDepartmentCode: station.userDepartmentCode,
      canOperateCurrentStep: station.canStart || station.canComplete,
      expectedProcess: station.expectedProcess,
      inProgressStep: station.inProgress,
      tracking: lot.tracking.map((t) => ({
        processCode: t.process.processCode,
        processName: t.process.processName,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        operator: t.operator,
        remarks: t.remarks,
        duration:
          t.endTime && t.startTime
            ? Math.round(
                (t.endTime.getTime() - t.startTime.getTime()) / 60000,
              ) + ' \u0e19\u0e32\u0e17\u0e35'
            : null,
      })),
    };

    await this.qrScanLogService.logEvent({
      domain: QrScanDomain.PRODUCTION,
      action: QrScanAction.PRODUCTION_STATUS_LOOKUP,
      qrCode: code,
      userId: userId ?? null,
      isSuccess: true,
      metadata: {
        lotStatus: lot.status,
        trackingCount: lot.tracking.length,
      },
    });

    return payload;
  }

  private normalizeLotLookupCode(input: string): string {
    const raw = (input ?? '').trim();
    if (!raw) return raw;
    // Some scanners may send full URLs or include query strings.
    const noQuery = raw.split('?')[0] ?? raw;
    const parts = noQuery.split('/').filter(Boolean);
    return (parts[parts.length - 1] ?? noQuery).trim();
  }

  async createProcess(dto: CreateProcessDto) {
    const process = this.processRepo.create(dto);
    return this.processRepo.save(process);
  }

  async getAllProcesses() {
    return this.processRepo.find({
      where: { isActive: true },
      order: { sequenceOrder: 'ASC' },
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
