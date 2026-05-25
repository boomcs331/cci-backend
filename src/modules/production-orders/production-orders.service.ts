import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { buildInventoryStyleQrCode } from '@app/common';
import { ProductProductionStep } from '../products/entities/product-production-step.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  EntityManager,
  In,
  Brackets,
  SelectQueryBuilder,
} from 'typeorm';
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

  /** ค่า operator ที่เป็นตัวเลขล้วน = user id จาก client เก่า — แปลงเป็น username (login) */
  private looksLikeUserId(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private async resolveOperatorLogin(
    dtoOperator?: string,
    user?: User | null,
  ): Promise<string> {
    const fromUser = user?.username?.trim();
    if (fromUser) return fromUser;

    const raw = dtoOperator?.trim();
    if (!raw) return 'scanner';

    if (this.looksLikeUserId(raw)) {
      try {
        const u = await this.authUserService.findUserById(raw);
        const login = u.username?.trim();
        if (login) return login;
      } catch {
        /* keep raw */
      }
    }
    return raw;
  }

  private async operatorLoginFromStored(
    stored: string | null | undefined,
  ): Promise<string | null> {
    const raw = stored?.trim();
    if (!raw) return null;
    if (!this.looksLikeUserId(raw)) return raw;
    try {
      const u = await this.authUserService.findUserById(raw);
      return u.username?.trim() || raw;
    } catch {
      return raw;
    }
  }

  private async enrichOrderTrackingOperators(order: ProductionOrder): Promise<void> {
    const cache = new Map<string, string>();
    for (const lot of order.lots ?? []) {
      for (const t of lot.tracking ?? []) {
        const op = t.operator?.trim();
        if (!op || !this.looksLikeUserId(op) || cache.has(op)) continue;
        const login = await this.operatorLoginFromStored(op);
        if (login) cache.set(op, login);
      }
    }
    for (const lot of order.lots ?? []) {
      for (const t of lot.tracking ?? []) {
        const op = t.operator?.trim();
        if (op && cache.has(op)) t.operator = cache.get(op)!;
      }
    }
  }

  private userIsAdminGlobal(user: User | null | undefined): boolean {
    if (!user) return false;
    const fromDirect = user.roles?.some((r) => r.code === 'ADMIN_GLOBAL');
    if (fromDirect) return true;
    return (
      user.roleAssignments?.some((a) => a.role?.code === 'ADMIN_GLOBAL') ??
      false
    );
  }

  /** รหัสแผนกที่ใช้เทียบ allowed_department_codes (รองรับ WE↔WELDING, PD↔PRESS) */
  private departmentCodesForGate(deptCode: string): string[] {
    const trimmed = deptCode.trim();
    const upper = trimmed.toUpperCase();
    const codes = new Set<string>([trimmed, upper]);
    if (upper === 'WE' || upper === 'WELDING') {
      codes.add('WE');
      codes.add('WELDING');
    }
    if (upper === 'PD' || upper === 'PRESS' || upper === 'PRESS_FIT') {
      codes.add('PD');
      codes.add('PRESS');
      codes.add('PRESS_FIT');
    }
    return [...codes];
  }

  /** คำสั่งผลิตที่ยังเปิดงานได้ (รวม DRAFT — ล็อต QR มักพร้อมที่ขั้นแรกก่อนกด start order) */
  private static readonly OPEN_ORDER_STATUSES = ['DRAFT', 'IN_PROGRESS'] as const;

  private applyDeptProcessGate(
    qb: SelectQueryBuilder<ProductionLot>,
    gateCodes: string[],
    processAlias = 'process',
  ): void {
    if (!gateCodes.length) {
      qb.andWhere('1 = 0');
      return;
    }
    qb.andWhere(
      new Brackets((sub) => {
        sub.where(`${processAlias}.allowedDepartmentCodes IS NULL`);
        gateCodes.forEach((code, idx) => {
          const param = `deptGate${idx}`;
          sub.orWhere(
            `:${param} = ANY(${processAlias}.allowedDepartmentCodes)`,
            { [param]: code },
          );
        });
      }),
    );
  }

  private deptAllowedForProcess(
    process: ProductionProcess | null | undefined,
    gateCodes: string[],
  ): boolean {
    if (!process) return false;
    const allowed = process.allowedDepartmentCodes;
    if (!allowed?.length) return true;
    if (!gateCodes.length) return false;
    return allowed.some((a) =>
      gateCodes.some(
        (g) => g.toUpperCase() === String(a ?? '').trim().toUpperCase(),
      ),
    );
  }

  private canUserActOnProcess(
    process: ProductionProcess,
    user: User | null,
    isGlobal: boolean,
  ): boolean {
    if (isGlobal) return true;
    if (!user) return false;
    const gateCodes = this.authUserService.expandedGateCodesForUser(user);
    return this.deptAllowedForProcess(process, gateCodes);
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

  /** ล็อตที่แผนกนี้ต้องรับงาน (รอเริ่มหรือกำลังทำที่ขั้นปัจจุบัน) */
  private lotIsDeptBacklog(lot: ProductionLot, gateCodes: string[]): boolean {
    if (['SPLIT', 'COMPLETED', 'REJECTED'].includes(lot.status)) {
      return false;
    }
    if (!['PENDING', 'IN_PROGRESS'].includes(lot.status)) {
      return false;
    }
    return this.deptAllowedForProcess(lot.currentProcess, gateCodes);
  }

  private attachDeptBacklogSummary(
    orders: ProductionOrder[],
    gateCodes: string[],
  ): Array<
    ProductionOrder & {
      deptBacklogLotCount: number;
      deptBacklogProcessCodes: string[];
    }
  > {
    return orders.map((order) => {
      const matching = (order.lots ?? []).filter((lot) =>
        this.lotIsDeptBacklog(lot, gateCodes),
      );
      const codes = [
        ...new Set(
          matching
            .map((l) => l.currentProcess?.processCode)
            .filter((c): c is string => Boolean(c)),
        ),
      ];
      return Object.assign(order, {
        deptBacklogLotCount: matching.length,
        deptBacklogProcessCodes: codes,
      });
    });
  }

  async findAllOrders(
    page = 1,
    limit = 10,
    userId?: string,
    activeDepartmentId?: string,
  ) {
    const user = userId ? await this.authUserService.findUserById(userId) : null;
    const isGlobal = this.userIsAdminGlobal(user);

    if (isGlobal) {
      const [orders, total] = await this.orderRepo.findAndCount({
        relations: ['product', 'lots', 'lots.currentProcess'],
        order: { createDate: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
        departmentScope: null,
      };
    }

    const scoped = this.authUserService.resolveProductionGateForActiveDepartment(
      user,
      activeDepartmentId,
    );
    const gateCodes = scoped.gateCodes;
    const deptLabel = scoped.departmentCode;
    const deptName = scoped.departmentName;

    if (!gateCodes.length) {
      return {
        orders: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        departmentScope: {
          departmentCode: null,
          departmentName: null,
          filtered: true,
          message:
            'ไม่พบแผนกของผู้ใช้ — ไม่สามารถแสดงรายการงานตามกระบวนการได้',
        },
      };
    }

    const idQb = this.lotRepo
      .createQueryBuilder('lot')
      .innerJoin('lot.order', 'order')
      .leftJoin('lot.currentProcess', 'process')
      .select('order.id', 'orderId')
      .addSelect('MAX(order.createDate)', 'orderCreateDate')
      .where('lot.status NOT IN (:...excluded)', {
        excluded: ['SPLIT', 'COMPLETED', 'REJECTED'],
      })
      .andWhere('lot.status IN (:...active)', {
        active: ['PENDING', 'IN_PROGRESS'],
      })
      .andWhere('order.status IN (:...openOrders)', {
        openOrders: [...ProductionOrdersService.OPEN_ORDER_STATUSES],
      })
      .andWhere('process.id IS NOT NULL');
    this.applyDeptProcessGate(idQb, gateCodes);
    const idRows = await idQb
      .groupBy('order.id')
      .orderBy('MAX(order.createDate)', 'DESC')
      .getRawMany<{ orderId: string; orderCreateDate: string }>();

    const orderIds = idRows.map((r) => Number(r.orderId)).filter((id) => !Number.isNaN(id));
    const total = orderIds.length;
    const pageIds = orderIds.slice((page - 1) * limit, page * limit);

    if (pageIds.length === 0) {
      return {
        orders: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
        departmentScope: {
          departmentCode: deptLabel,
          departmentName: deptName,
          filtered: true,
          message: `แสดงเฉพาะคำสั่งผลิตที่มีล็อตคงค้างในกระบวนการของแผนก ${deptLabel}`,
        },
      };
    }

    const orders = await this.orderRepo.find({
      where: { id: In(pageIds) },
      relations: ['product', 'lots', 'lots.currentProcess'],
      order: { createDate: 'DESC' },
    });

    const orderById = new Map(orders.map((o) => [o.id, o]));
    const sorted = pageIds
      .map((id) => orderById.get(id))
      .filter((o): o is ProductionOrder => Boolean(o));

    const withSummary = this.attachDeptBacklogSummary(sorted, gateCodes);

    return {
      orders: withSummary,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      departmentScope: {
        departmentCode: deptLabel,
        departmentName: deptName,
        filtered: true,
        message: `แสดงเฉพาะคำสั่งผลิตที่มีล็อตคงค้างในกระบวนการของแผนก ${deptLabel}`,
      },
    };
  }

  async findOrderWithLots(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'product',
        'product.customer',
        'lots',
        'lots.currentProcess',
        'lots.tracking',
        'lots.tracking.process',
        'plan',
        'planItem',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.enrichOrderTrackingOperators(order);
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
      if (lot.order.status === 'DRAFT') {
        lot.order.status = 'IN_PROGRESS';
        await manager.save(lot.order);
      }
      if (lot.status === 'SPLIT') {
        throw new BadRequestException(
          'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
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

      const operator = await this.resolveOperatorLogin(dto.operator, user);

      const qtyIn = Number(lot.quantity);
      const tracking = manager.create(ProductionLotTracking, {
        lotId: lot.id,
        processId: dto.processId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        operator,
        quantityIn: qtyIn,
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
          'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
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
      tracking.quantityOut = Number(lot.quantity);
      if (tracking.quantityIn == null) {
        tracking.quantityIn = Number(lot.quantity);
      }
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
      const stockCreateBy =
        user?.username ?? tracking.operator ?? 'system';
      const stepOperator = tracking.operator ?? stockCreateBy;

      if (currentIndex === orderedProcesses.length - 1) {
        lot.status = 'COMPLETED';
        lot.currentProcessId = undefined;
      } else {
        lot.currentProcessId = orderedProcesses[currentIndex + 1].id;
      }
      await manager.save(lot);

      let finalizedByAutoComplete = false;
      if (lot.status !== 'COMPLETED') {
        finalizedByAutoComplete = await this.autoCloseTerminalCompleteStep(
          manager,
          lot,
          orderedProcesses,
          stepOperator,
          stockCreateBy,
          dto.remarks,
        );
      }

      if (
        lot.status === 'COMPLETED' &&
        prevLotStatus !== 'COMPLETED' &&
        !finalizedByAutoComplete
      ) {
        await this.productStockService.addFinishedGoodsFromLot(
          manager,
          lot.order.productId,
          lot.quantity,
          {
            productionLotId: lot.id,
            productionLotNo: lot.lotNo,
            productionQrCode: lot.qrCode,
            productionOrderNo: lot.order.orderNo,
            createBy: stockCreateBy,
          },
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

      const operator = await this.resolveOperatorLogin(dto.operator, user);
      const reason = dto.reason?.trim();
      if (!reason) {
        throw new BadRequestException('reason is required');
      }

      const orderNoRef = lot.orderNoRef ?? lot.order?.orderNo ?? null;
      const isFirstProcessStep =
        currentIdx === 0 && moveReleasedToNextStep && Boolean(nextProcessId);

      const mapChild = (
        c: ProductionLot,
        opts?: { keptOriginalQr?: boolean; parentId?: number },
      ) => ({
        id: c.id,
        lotNo: c.lotNo,
        orderNoRef: c.orderNoRef ?? orderNoRef,
        qrCode: c.qrCode,
        quantity: Number(c.quantity),
        status: c.status,
        currentProcessId: c.currentProcessId ?? null,
        parentLotId: opts?.parentId ?? c.parentLotId ?? null,
        keptOriginalQr: opts?.keptOriginalQr ?? false,
      });

      const logSplitEvent = (
        childrenMeta: Array<{ id: number; lotNo: string; qrCode: string }>,
      ) =>
        this.qrScanLogService.logEvent({
          domain: QrScanDomain.PRODUCTION,
          action: QrScanAction.PRODUCTION_STATION_LOOKUP,
          qrCode: lot.qrCode,
          userId: userId ?? null,
          isSuccess: true,
          metadata: {
            event: 'LOT_SPLIT',
            splitMode: isFirstProcessStep ? 'FIRST_PROCESS' : 'GENERAL',
            parentLotId: lot.id,
            parentLotNo: lot.lotNo,
            reason,
            operator,
            releasedQuantity: releaseQty,
            remainingQuantity: remainingQty,
            children: childrenMeta,
          },
        });

      /** ขั้นตอนแรก: ส่วนที่ปล่อยไปขั้นถัดไปใช้ QR เดิม — ส่วนคงเหลือได้ QR ใหม่ */
      if (isFirstProcessStep && currentProcessId && nextProcessId) {
        const now = new Date();
        const splitNote = `แบ่งจาก ${lot.lotNo}: ${reason}`;

        if (openTracking) {
          openTracking.quantityOut = releaseQty;
          if (openTracking.quantityIn == null) {
            openTracking.quantityIn = sourceQty;
          }
          openTracking.status = 'COMPLETED';
          openTracking.endTime = now;
          openTracking.remarks = openTracking.remarks?.trim()
            ? `${openTracking.remarks} · split (${reason})`
            : `split parent: ${reason}`;
          await manager.save(openTracking);
        } else {
          await manager.save(
            manager.create(ProductionLotTracking, {
              lotId: lot.id,
              processId: currentProcessId,
              startTime: now,
              endTime: now,
              status: 'COMPLETED',
              operator,
              quantityIn: sourceQty,
              quantityOut: releaseQty,
              remarks: splitNote,
            }),
          );
        }

        lot.quantity = releaseQty;
        lot.currentProcessId = nextProcessId;
        lot.status = 'IN_PROGRESS';
        lot.orderNoRef = orderNoRef;
        lot.splitReason = reason;
        const savedKeptQr = await manager.save(lot);

        const terminalComplete = this.getTerminalCompleteProcess(orderedProcesses);
        if (terminalComplete && terminalComplete.id === nextProcessId) {
          await this.autoCloseTerminalCompleteStep(
            manager,
            savedKeptQr,
            orderedProcesses,
            operator,
            operator,
            splitNote,
          );
        } else {
          await manager.save(
            manager.create(ProductionLotTracking, {
              lotId: lot.id,
              processId: nextProcessId,
              startTime: now,
              status: 'IN_PROGRESS',
              operator,
              quantityIn: releaseQty,
              remarks: splitNote,
            }),
          );
        }

        const childLotNoRemaining = `${lot.lotNo}-S${String(splitCountRaw + 1).padStart(2, '0')}`;
        const childOrderLabelRemaining = `${childOrderLabelBase}-S${String(splitCountRaw + 1).padStart(2, '0')}`;
        const remaining = manager.create(ProductionLot, {
          orderId: lot.orderId,
          lotNo: childLotNoRemaining,
          lotPdNo: lot.lotPdNo,
          orderLotLabel: childOrderLabelRemaining,
          orderNoRef,
          qrCode: buildInventoryStyleQrCode(childLotNoRemaining),
          sequenceNo: maxSeq + 1,
          quantity: remainingQty,
          parentLotId: lot.id,
          splitReason: reason,
          currentProcessId,
          status: 'PENDING',
        });
        const savedRemaining = await manager.save(remaining);

        await this.inheritPriorProcessTrackingFromParent(
          manager,
          lot,
          savedRemaining.id,
          remainingQty,
          orderedProcesses,
          currentProcessId,
        );
        await this.applyRemainingLotWorkflowAfterSplit(manager, savedRemaining, {
          remainingQty,
          currentProcessId,
          parentWasInProgress: false,
          operator,
          reason,
          parentLotNo: lot.lotNo,
          openTrackingStartTime: null,
          openTrackingOperator: null,
        });

        const childrenOut = [
          mapChild(savedKeptQr, { keptOriginalQr: true }),
          mapChild(savedRemaining),
        ];
        await logSplitEvent(
          childrenOut.map((c) => ({ id: c.id, lotNo: c.lotNo, qrCode: c.qrCode })),
        );

        return {
          splitTrace: {
            splitMode: 'FIRST_PROCESS',
            parentLotId: lot.id,
            parentLotNo: lot.lotNo,
            parentQrCode: lot.qrCode,
            parentStatus: savedKeptQr.status,
            parentRetired: false,
            reason,
            operator,
            releasedQuantity: releaseQty,
            remainingQuantity: remainingQty,
            splitAt: new Date().toISOString(),
          },
          sourceLot: {
            id: lot.id,
            lotNo: lot.lotNo,
            orderNoRef,
            qrCode: lot.qrCode,
            quantity: sourceQty,
            status: savedKeptQr.status,
            retired: false,
            keptOriginalQr: true,
          },
          children: childrenOut,
        };
      }

      /** ขั้นตอนที่ไม่ใช่ขั้นแรก: ยกเลิก QR เดิม — ลูกทั้งคู่ได้ QR ใหม่ */
      if (currentProcessId && openTracking) {
        openTracking.quantityOut = releaseQty;
        if (openTracking.quantityIn == null) {
          openTracking.quantityIn = sourceQty;
        }
        openTracking.status = 'COMPLETED';
        openTracking.endTime = new Date();
        const priorRemarks = openTracking.remarks?.trim();
        openTracking.remarks = priorRemarks
          ? `${priorRemarks} · split (${reason})`
          : `split parent: ${reason}`;
        await manager.save(openTracking);
      }

      const released = manager.create(ProductionLot, {
        orderId: lot.orderId,
        lotNo: childLotNoA,
        lotPdNo: lot.lotPdNo,
        orderLotLabel: childOrderLabelA,
        orderNoRef,
        qrCode: buildInventoryStyleQrCode(childLotNoA),
        sequenceNo: maxSeq + 1,
        quantity: releaseQty,
        parentLotId: lot.id,
        splitReason: reason,
        currentProcessId,
        status: 'PENDING',
      });
      const remaining = manager.create(ProductionLot, {
        orderId: lot.orderId,
        lotNo: childLotNoB,
        lotPdNo: lot.lotPdNo,
        orderLotLabel: childOrderLabelB,
        orderNoRef,
        qrCode: buildInventoryStyleQrCode(childLotNoB),
        sequenceNo: maxSeq + 2,
        quantity: remainingQty,
        parentLotId: lot.id,
        splitReason: reason,
        currentProcessId,
        status: 'PENDING',
      });

      const savedReleased = await manager.save(released);
      const savedRemaining = await manager.save(remaining);

      if (currentProcessId) {
        await this.inheritPriorProcessTrackingFromParent(
          manager,
          lot,
          savedReleased.id,
          releaseQty,
          orderedProcesses,
          currentProcessId,
        );
        await this.inheritPriorProcessTrackingFromParent(
          manager,
          lot,
          savedRemaining.id,
          remainingQty,
          orderedProcesses,
          currentProcessId,
        );

        await this.applyReleasedLotWorkflowAfterSplit(
          manager,
          savedReleased,
          {
            releaseQty,
            currentProcessId,
            nextProcessId,
            moveReleasedToNextStep,
            operator,
            reason,
            parentLotNo: lot.lotNo,
          },
        );
        await this.applyRemainingLotWorkflowAfterSplit(
          manager,
          savedRemaining,
          {
            remainingQty,
            currentProcessId,
            parentWasInProgress: lot.status === 'IN_PROGRESS',
            operator,
            reason,
            parentLotNo: lot.lotNo,
            openTrackingStartTime: openTracking?.startTime ?? null,
            openTrackingOperator: openTracking?.operator ?? null,
          },
        );
      }

      lot.status = 'SPLIT';
      lot.currentProcessId = undefined;
      lot.splitReason = reason;
      lot.orderNoRef = orderNoRef;
      await manager.save(lot);

      const childrenOut = [mapChild(savedReleased), mapChild(savedRemaining)];
      await logSplitEvent(
        childrenOut.map((c) => ({ id: c.id, lotNo: c.lotNo, qrCode: c.qrCode })),
      );

      return {
        splitTrace: {
          splitMode: 'GENERAL',
          parentLotId: lot.id,
          parentLotNo: lot.lotNo,
          parentQrCode: lot.qrCode,
          parentStatus: 'SPLIT',
          parentRetired: true,
          reason,
          operator,
          releasedQuantity: releaseQty,
          remainingQuantity: remainingQty,
          splitAt: new Date().toISOString(),
        },
        sourceLot: {
          id: lot.id,
          lotNo: lot.lotNo,
          orderNoRef,
          qrCode: lot.qrCode,
          quantity: sourceQty,
          status: 'SPLIT',
          retired: true,
          keptOriginalQr: false,
        },
        children: childrenOut,
      };
    });
  }

  async getLotStepQuantities(qrCode: string, _userId?: string) {
    const code = this.normalizeLotLookupCode(qrCode);
    const lot = await this.lotRepo.findOne({
      where: [{ qrCode: code }, { lotNo: code }],
      relations: [
        'order',
        'order.product',
        'tracking',
        'tracking.process',
      ],
    });
    if (!lot) throw new NotFoundException('QR Code not found');
    if (lot.status === 'SPLIT') {
      throw new BadRequestException(
        'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
      );
    }

    const childLots = await this.lotRepo.find({
      where: { parentLotId: lot.id },
      order: { id: 'ASC' },
    });

    return this.buildLotStepTracePayload(lot, childLots);
  }

  async getLotStepTraceReport(filters: {
    startDate?: string;
    endDate?: string;
    orderNo?: string;
    lotSearch?: string;
    productId?: number;
    status?: string;
    includeSplitRetired?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 30));
    const skip = (page - 1) * limit;

    const qb = this.lotRepo
      .createQueryBuilder('lot')
      .innerJoinAndSelect('lot.order', 'order')
      .innerJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('lot.tracking', 'tracking')
      .leftJoinAndSelect('tracking.process', 'process')
      .orderBy('product.productCode', 'ASC')
      .addOrderBy('lot.createDate', 'DESC')
      .addOrderBy('lot.id', 'DESC');

    if (filters.startDate?.trim()) {
      qb.andWhere('lot.createDate >= :startDate::date', {
        startDate: filters.startDate.trim(),
      });
    }
    if (filters.endDate?.trim()) {
      qb.andWhere("lot.createDate < (:endDate::date + interval '1 day')", {
        endDate: filters.endDate.trim(),
      });
    }
    if (filters.orderNo?.trim()) {
      qb.andWhere('order.orderNo ILIKE :orderNo', {
        orderNo: `%${filters.orderNo.trim()}%`,
      });
    }
    if (filters.lotSearch?.trim()) {
      const q = `%${filters.lotSearch.trim()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('lot.lotNo ILIKE :lotQ', { lotQ: q })
            .orWhere('lot.qrCode ILIKE :lotQ', { lotQ: q })
            .orWhere('lot.orderLotLabel ILIKE :lotQ', { lotQ: q });
        }),
      );
    }
    if (filters.productId) {
      qb.andWhere('order.productId = :productId', {
        productId: filters.productId,
      });
    }
    if (filters.status?.trim()) {
      qb.andWhere('lot.status = :lotStatus', {
        lotStatus: filters.status.trim().toUpperCase(),
      });
    } else if (!filters.includeSplitRetired) {
      qb.andWhere('lot.status <> :splitStatus', { splitStatus: 'SPLIT' });
    }

    const total = await qb.getCount();
    const lots = await qb.skip(skip).take(limit).getMany();

    const lotIds = lots.map((l) => l.id);
    const childLots =
      lotIds.length > 0
        ? await this.lotRepo.find({
            where: { parentLotId: In(lotIds) },
            order: { id: 'ASC' },
          })
        : [];
    const childrenByParent = new Map<number, ProductionLot[]>();
    for (const c of childLots) {
      if (c.parentLotId == null) continue;
      const list = childrenByParent.get(c.parentLotId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentLotId, list);
    }

    const data = await Promise.all(
      lots.map((lot) =>
        this.buildLotStepTracePayload(
          lot,
          childrenByParent.get(lot.id) ?? [],
        ),
      ),
    );

    return {
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  private async buildLotStepTracePayload(
    lot: ProductionLot,
    childLots: ProductionLot[] = [],
  ) {
    const orderedProcesses = await this.resolveOrderedProcesses(
      this.dataSource.manager,
      lot.order.productId,
    );

    const trackingByProcess = new Map(
      (lot.tracking ?? []).map((t) => [t.processId, t]),
    );

    const steps = await Promise.all(
      orderedProcesses.map(async (proc, idx) => {
        const t = trackingByProcess.get(proc.id);
        let stepStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' =
          'pending';
        if (t?.status === 'IN_PROGRESS') stepStatus = 'in_progress';
        else if (t?.status === 'COMPLETED') stepStatus = 'completed';
        else if (t?.status === 'REJECTED') stepStatus = 'rejected';

        let qtyIn = t?.quantityIn != null ? Number(t.quantityIn) : null;
        let qtyOut = t?.quantityOut != null ? Number(t.quantityOut) : null;

        if (t && qtyIn == null) {
          qtyIn = Number(lot.quantity);
        }
        if (t?.status === 'COMPLETED' && qtyOut == null) {
          qtyOut = Number(lot.quantity);
        }

        const operator =
          t?.operator != null
            ? (await this.operatorLoginFromStored(t.operator)) ?? t.operator
            : null;

        return {
          stepOrder: idx + 1,
          processId: proc.id,
          processCode: proc.processCode,
          processName: proc.processName,
          status: stepStatus,
          quantityIn: qtyIn,
          quantityOut: qtyOut,
          operator,
          startTime: t?.startTime ?? null,
          endTime: t?.endTime ?? null,
          remarks: t?.remarks ?? null,
        };
      }),
    );

    return {
      lotId: lot.id,
      lotNo: lot.lotNo,
      qrCode: lot.qrCode,
      lotQuantity: Number(lot.quantity),
      lotStatus: lot.status,
      lotCreatedAt: lot.createDate ?? null,
      orderNo: lot.order.orderNo,
      productId: lot.order.productId,
      productCode: lot.order.product?.productCode ?? null,
      productName: lot.order.product?.productName ?? null,
      unit: 'PCS',
      steps,
      splitChildren: childLots.map((c) => ({
        lotNo: c.lotNo,
        qrCode: c.qrCode,
        quantity: Number(c.quantity),
        status: c.status,
        splitReason: c.splitReason ?? null,
      })),
    };
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
        'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
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
        'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
      );
    }

    const rows = lot.tracking ?? [];
    const mapped = await Promise.all(
      rows.map(async (t) => ({
        status: t.status,
        processCode: t.process?.processCode ?? null,
        processName: t.process?.processName ?? null,
        startTime: t.startTime ?? null,
        endTime: t.endTime ?? null,
        quantityIn: t.quantityIn != null ? Number(t.quantityIn) : null,
        quantityOut: t.quantityOut != null ? Number(t.quantityOut) : null,
        operator: (await this.operatorLoginFromStored(t.operator)) ?? null,
        remarks: t.remarks ?? null,
      })),
    );
    return mapped;
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

  async getInProgressLotsForMyDept(
    userId?: string,
    activeDepartmentId?: string,
  ) {
    const user = userId ? await this.authUserService.findUserById(userId) : null;
    const isGlobal = this.userIsAdminGlobal(user);

    const gateCodes = isGlobal
      ? user
        ? this.authUserService.expandedGateCodesForUser(user)
        : []
      : this.authUserService.resolveProductionGateForActiveDepartment(
          user,
          activeDepartmentId,
        ).gateCodes;

    // For non-admin, we gate visibility by permissions:
    // - IN_PROGRESS list is part of the QR station workflow, so users must have either read or update.
    const canRead = userId
      ? await this.authUserService.hasPermission(
          String(userId),
          'production_orders.read',
        )
      : false;
    const canUpdate = userId
      ? await this.authUserService.hasPermission(
          String(userId),
          'production_orders.update',
        )
      : false;

    if (!isGlobal && !canRead && !canUpdate) {
      return [];
    }

    // ล็อตคงค้างที่ขั้นปัจจุบัน — สอดคล้อง findAllOrders / lotIsDeptBacklog
    // Admin: ทุกสถานะที่ยังไม่ปิดงาน
    // Non-admin: PENDING หรือ IN_PROGRESS ที่ currentProcess เปิดให้แผนกนี้ (รวมรอเริ่ม WELDING)
    const qb = this.lotRepo
      .createQueryBuilder('lot')
      .innerJoin('lot.order', 'order')
      .innerJoin('order.product', 'product')
      .innerJoin('lot.currentProcess', 'process')
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
      qb.where('lot.status NOT IN (:...excluded)', {
        excluded: ['SPLIT', 'COMPLETED', 'REJECTED'],
      });
    } else {
      if (!gateCodes.length) {
        return [];
      }
      qb
        .where('lot.status IN (:...active)', {
          active: ['PENDING', 'IN_PROGRESS'],
        })
        .andWhere('order.status IN (:...openOrders)', {
          openOrders: [...ProductionOrdersService.OPEN_ORDER_STATUSES],
        });
      this.applyDeptProcessGate(qb, gateCodes);
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
        'QR Code นี้ถูกแบ่งและยกเลิกแล้ว โปรดสแกน QR Code ชุดย่อยแทน',
      );
    }

    const station = await this.buildLotQrStationView(lot, userId);

    const trackingRows = await Promise.all(
      lot.tracking.map(async (t) => ({
        processCode: t.process.processCode,
        processName: t.process.processName,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        quantityIn: t.quantityIn != null ? Number(t.quantityIn) : null,
        quantityOut: t.quantityOut != null ? Number(t.quantityOut) : null,
        operator: (await this.operatorLoginFromStored(t.operator)) ?? t.operator,
        remarks: t.remarks,
        duration:
          t.endTime && t.startTime
            ? Math.round(
                (t.endTime.getTime() - t.startTime.getTime()) / 60000,
              ) + ' \u0e19\u0e32\u0e17\u0e35'
            : null,
      })),
    );

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
      tracking: trackingRows,
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

  private normalizeProcessCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /** ขั้นสุดท้ายของ flow ที่เป็น process_code COMPLETE (ไม่มีขั้นถัดไป) */
  private getTerminalCompleteProcess(
    orderedProcesses: ProductionProcess[],
  ): ProductionProcess | null {
    if (orderedProcesses.length < 2) return null;
    const last = orderedProcesses[orderedProcesses.length - 1];
    if (this.normalizeProcessCode(last.processCode) !== 'COMPLETE') return null;
    return last;
  }

  private async resolveOrderedProcessesForLot(
    manager: EntityManager,
    lot: ProductionLot,
  ): Promise<ProductionProcess[]> {
    const order =
      lot.order ??
      (await manager.findOne(ProductionOrder, { where: { id: lot.orderId } }));
    if (!order) return [];
    return this.resolveOrderedProcesses(manager, order.productId);
  }

  /**
   * เมื่อขั้นก่อน Complete (ขั้นสุดท้ายของ flow) ปิดแล้ว — ปิด Complete ทันที
   * ไม่สร้าง IN_PROGRESS / คิวงานสำหรับ Complete
   */
  private async autoCloseTerminalCompleteStep(
    manager: EntityManager,
    lot: ProductionLot,
    orderedProcesses: ProductionProcess[],
    operator: string,
    stockCreateBy: string,
    remarks?: string,
  ): Promise<boolean> {
    const completeProc = this.getTerminalCompleteProcess(orderedProcesses);
    if (!completeProc) return false;

    const prevProc = orderedProcesses[orderedProcesses.length - 2];
    const prevClosed = await manager.findOne(ProductionLotTracking, {
      where: { lotId: lot.id, processId: prevProc.id, status: 'COMPLETED' },
    });
    if (!prevClosed) return false;

    const alreadyDone = await manager.findOne(ProductionLotTracking, {
      where: { lotId: lot.id, processId: completeProc.id, status: 'COMPLETED' },
    });
    if (alreadyDone) {
      if (lot.status !== 'COMPLETED') {
        lot.status = 'COMPLETED';
        lot.currentProcessId = undefined;
        await manager.save(lot);
      }
      return true;
    }

    const now = new Date();
    const qty = Number(lot.quantity);
    const autoRemark = remarks?.trim()
      ? `${remarks.trim()} · ปิด Complete อัตโนมัติ`
      : 'ปิด Complete อัตโนมัติ';

    const openComplete = await manager.findOne(ProductionLotTracking, {
      where: {
        lotId: lot.id,
        processId: completeProc.id,
        status: 'IN_PROGRESS',
      },
    });
    if (openComplete) {
      openComplete.status = 'COMPLETED';
      openComplete.endTime = now;
      openComplete.quantityOut = qty;
      if (openComplete.quantityIn == null) {
        openComplete.quantityIn = qty;
      }
      openComplete.remarks = openComplete.remarks?.trim()
        ? `${openComplete.remarks} · ${autoRemark}`
        : autoRemark;
      await manager.save(openComplete);
    } else {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: lot.id,
          processId: completeProc.id,
          startTime: now,
          endTime: now,
          status: 'COMPLETED',
          operator,
          quantityIn: qty,
          quantityOut: qty,
          remarks: autoRemark,
        }),
      );
    }

    const prevLotStatus = lot.status;
    lot.status = 'COMPLETED';
    lot.currentProcessId = undefined;
    await manager.save(lot);

    if (prevLotStatus !== 'COMPLETED') {
      const order =
        lot.order ??
        (await manager.findOne(ProductionOrder, {
          where: { id: lot.orderId },
        }));
      if (order) {
        await this.productStockService.addFinishedGoodsFromLot(
          manager,
          order.productId,
          lot.quantity,
          {
            productionLotId: lot.id,
            productionLotNo: lot.lotNo,
            productionQrCode: lot.qrCode,
            productionOrderNo: order.orderNo,
            createBy: stockCreateBy,
          },
        );
      }
    }

    return true;
  }

  /** Clone COMPLETED steps before current process from parent → child after split. */
  private async inheritPriorProcessTrackingFromParent(
    manager: EntityManager,
    parentLot: ProductionLot,
    childLotId: number,
    childQuantity: number,
    orderedProcesses: ProductionProcess[],
    currentProcessId: number,
  ): Promise<void> {
    const currentIdx = orderedProcesses.findIndex(
      (p) => p.id === currentProcessId,
    );
    if (currentIdx <= 0) return;

    const priorProcessIds = orderedProcesses
      .slice(0, currentIdx)
      .map((p) => p.id);

    const parentRows = await manager.find(ProductionLotTracking, {
      where: {
        lotId: parentLot.id,
        processId: In(priorProcessIds),
        status: 'COMPLETED',
      },
      order: { id: 'ASC' },
    });

    for (const pt of parentRows) {
      const exists = await manager.findOne(ProductionLotTracking, {
        where: { lotId: childLotId, processId: pt.processId },
      });
      if (exists) continue;

      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: childLotId,
          processId: pt.processId,
          startTime: pt.startTime ?? pt.createDate,
          endTime: pt.endTime ?? pt.startTime ?? new Date(),
          status: 'COMPLETED',
          operator: pt.operator,
          quantityIn: childQuantity,
          quantityOut: childQuantity,
          remarks: this.appendSplitLineageRemark(pt.remarks, parentLot.lotNo),
        }),
      );
    }
  }

  private appendSplitLineageRemark(
    prior: string | null | undefined,
    parentLotNo: string,
  ): string {
    const tag = `สืบทอดจาก ${parentLotNo} (split)`;
    const base = prior?.trim();
    if (!base) return tag;
    if (base.includes(parentLotNo)) return base;
    return `${base} · ${tag}`;
  }

  /** ล็อตย่อยส่วนที่ปล่อย — ปิดขั้นปัจจุบันแล้วส่งไปขั้นถัดไป (ถ้า workflow อนุญาต) */
  private async applyReleasedLotWorkflowAfterSplit(
    manager: EntityManager,
    child: ProductionLot,
    opts: {
      releaseQty: number;
      currentProcessId: number;
      nextProcessId: number | undefined;
      moveReleasedToNextStep: boolean;
      operator: string;
      reason: string;
      parentLotNo: string;
    },
  ): Promise<void> {
    const {
      releaseQty,
      currentProcessId,
      nextProcessId,
      moveReleasedToNextStep,
      operator,
      reason,
      parentLotNo,
    } = opts;
    const now = new Date();
    const splitNote = `แบ่งจาก ${parentLotNo}: ${reason}`;

    if (moveReleasedToNextStep && nextProcessId) {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: currentProcessId,
          startTime: now,
          endTime: now,
          status: 'COMPLETED',
          operator,
          quantityIn: releaseQty,
          quantityOut: releaseQty,
          remarks: splitNote,
        }),
      );
      child.currentProcessId = nextProcessId;
      child.status = 'IN_PROGRESS';
      await manager.save(child);

      const orderedProcesses =
        await this.resolveOrderedProcessesForLot(manager, child);
      const terminalComplete =
        this.getTerminalCompleteProcess(orderedProcesses);
      if (terminalComplete && terminalComplete.id === nextProcessId) {
        await this.autoCloseTerminalCompleteStep(
          manager,
          child,
          orderedProcesses,
          operator,
          operator,
          splitNote,
        );
        return;
      }

      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: nextProcessId,
          startTime: now,
          status: 'IN_PROGRESS',
          operator,
          quantityIn: releaseQty,
          remarks: splitNote,
        }),
      );
      return;
    }

    child.currentProcessId = currentProcessId;
    child.status = 'IN_PROGRESS';
    await manager.save(child);
    await manager.save(
      manager.create(ProductionLotTracking, {
        lotId: child.id,
        processId: currentProcessId,
        startTime: now,
        status: 'IN_PROGRESS',
        operator,
        quantityIn: releaseQty,
        remarks: splitNote,
      }),
    );
  }

  /** ล็อตย่อยส่วนที่เหลือ — คงอยู่ขั้นปัจจุบัน */
  private async applyRemainingLotWorkflowAfterSplit(
    manager: EntityManager,
    child: ProductionLot,
    opts: {
      remainingQty: number;
      currentProcessId: number;
      parentWasInProgress: boolean;
      operator: string;
      reason: string;
      parentLotNo: string;
      openTrackingStartTime: Date | null;
      openTrackingOperator: string | null;
    },
  ): Promise<void> {
    const {
      remainingQty,
      currentProcessId,
      parentWasInProgress,
      operator,
      reason,
      parentLotNo,
      openTrackingStartTime,
      openTrackingOperator,
    } = opts;

    child.currentProcessId = currentProcessId;
    child.status = parentWasInProgress ? 'IN_PROGRESS' : 'PENDING';
    await manager.save(child);

    if (parentWasInProgress) {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: currentProcessId,
          startTime: openTrackingStartTime ?? new Date(),
          status: 'IN_PROGRESS',
          operator: openTrackingOperator ?? operator,
          quantityIn: remainingQty,
          remarks: `คงเหลือจาก split ${parentLotNo}: ${reason}`,
        }),
      );
    }
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
