import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, In } from 'typeorm';
import {
  ProductionPlan,
  ProductionPlanItem,
  MaterialReservation,
  PlanStatus,
} from './entities';
import { Product, ProductBom } from '../products/entities';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';
import {
  CreateProductionPlanDto,
  UpdateProductionPlanDto,
  AddPlanItemDto,
  UpdatePlanItemDto,
  GenerateProductQrOrdersFromPlanDto,
} from './dto';
import { ProductionOrdersService } from '../production-orders/production-orders.service';
import { CreateProductionOrderDto } from '../production-orders/dto';
import { ProductionOrder } from '../production-orders/entities/production-order.entity';

@Injectable()
export class ProductionPlansService {
  constructor(
    @InjectRepository(ProductionPlan)
    private planRepo: Repository<ProductionPlan>,
    @InjectRepository(ProductionPlanItem)
    private itemRepo: Repository<ProductionPlanItem>,
    @InjectRepository(MaterialReservation)
    private reservationRepo: Repository<MaterialReservation>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBom)
    private bomRepo: Repository<ProductBom>,
    @InjectRepository(MaterialsStock)
    private stockRepo: Repository<MaterialsStock>,
    private dataSource: DataSource,
    private productionOrdersService: ProductionOrdersService,
  ) {}

  async create(dto: CreateProductionPlanDto, username: string) {
    const planCode = await this.generatePlanCode();

    const plan = this.planRepo.create({
      planCode,
      planName: dto.planName,
      planDate: new Date(dto.planDate),
      remarks: dto.remarks,
      createBy: username,
    });

    const savedPlan = await this.planRepo.save(plan);

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.addItem(savedPlan.id, item);
      }
    }

    return this.findOne(savedPlan.id);
  }

  /** remark จ่ายออก = `จ่ายออกสำหรับแผนการผลิต {planCode}` */
  private planIssueRemark(planCode: string) {
    return `จ่ายออกสำหรับแผนการผลิต ${planCode}`;
  }

  private async getMaterialIssuedByMapForPlanCodes(
    planCodes: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    const unique = [...new Set(planCodes.filter((c) => c?.trim()))];
    for (const code of unique) {
      map.set(code, []);
    }
    if (!unique.length) return map;

    const remarks = unique.map((c) => this.planIssueRemark(c));
    const rows = await this.dataSource.query(
      `SELECT mis.remark AS remark, TRIM(mis.create_by) AS create_by
       FROM material_issuing mis
       WHERE mis.remark = ANY($1::text[])
         AND mis.create_by IS NOT NULL
         AND TRIM(mis.create_by) <> ''
       ORDER BY mis.remark, create_by`,
      [remarks],
    );

    const prefix = 'จ่ายออกสำหรับแผนการผลิต ';
    for (const r of rows) {
      const remark = String(r.remark ?? '');
      if (!remark.startsWith(prefix)) continue;
      const code = remark.slice(prefix.length);
      const by = String(r.create_by ?? '').trim();
      if (!by || !map.has(code)) continue;
      const list = map.get(code)!;
      if (!list.includes(by)) list.push(by);
    }
    return map;
  }

  async findAll() {
    const plans = await this.planRepo.find({
      relations: ['items', 'items.product'],
      order: { createDate: 'DESC' },
    });
    const issuerMap = await this.getMaterialIssuedByMapForPlanCodes(
      plans.map((p) => p.planCode),
    );
    return plans.map((plan) => ({
      ...plan,
      materialIssuedBy: issuerMap.get(plan.planCode) ?? [],
    }));
  }

  async findOne(id: number) {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!plan) throw new NotFoundException('ไม่พบแผนการผลิต');
    return plan;
  }

  /**
   * สร้าง Production Order + รายการ QR (production_lots) ตามจำนวน ceil(quantity / lotSize) ต่อรายการในแผน
   * รูปแบบ QR เดียวกับรับเข้าวัตถุดิบ (buildInventoryStyleQrCode จาก lot_no แบบ PG…)
   * lotSize: defaultLotSize หรือ lotSizeByProductId[productId] หรือ products.lot_size (จำนวนต่อบรรจุ) หรือ 100
   * แผนต้อง reserved หรือ confirmed
   */
  async generateProductQrOrdersFromPlan(
    planId: number,
    dto: GenerateProductQrOrdersFromPlanDto,
    username: string,
  ) {
    const plan = await this.findOne(planId);
    if (
      plan.status !== PlanStatus.CONFIRMED &&
      plan.status !== PlanStatus.RESERVED
    ) {
      throw new BadRequestException(
        'สร้างคำสั่งผลิต / QR ได้เมื่อแผนถูกจอง (reserved) หรือยืนยันแล้ว (confirmed) เท่านั้น — จองวัตถุดิบก่อน หรือยืนยันแผน',
      );
    }
    if (!plan.items?.length) {
      throw new BadRequestException('แผนไม่มีรายการสินค้า');
    }

    const itemsOrdered = [...plan.items].sort((a, b) => a.id - b.id);

    const results: Array<{
      planItemId: number;
      productId: number;
      quantity: number;
      lotSize: number;
      totalQrCodes: number;
      productionOrder: NonNullable<
        Awaited<ReturnType<ProductionOrdersService['findOrderWithLots']>>
      >;
    }> = [];

    for (const item of itemsOrdered) {
      if (dto.planItemIds?.length && !dto.planItemIds.includes(item.id)) {
        continue;
      }

      let lotSizeOpt: number | undefined = dto.defaultLotSize;
      if (lotSizeOpt == null && dto.lotSizeByProductId) {
        const fromMap = dto.lotSizeByProductId[String(item.productId)];
        if (fromMap != null && fromMap > 0) {
          lotSizeOpt = fromMap;
        }
      }

      const qty = Number(item.quantity);
      if (!(qty > 0)) {
        continue;
      }

      const createDto: CreateProductionOrderDto = {
        productId: item.productId,
        orderQuantity: qty,
        planId: plan.id,
        planItemId: item.id,
        remarks: item.remarks?.trim() || `แผน ${plan.planCode}`,
      };
      if (lotSizeOpt != null && lotSizeOpt > 0) {
        createDto.lotSize = lotSizeOpt;
      }

      const existing =
        await this.productionOrdersService.findOrderByPlanAndPlanItem(
          plan.id,
          item.id,
        );
      const productionOrder = existing
        ? await this.productionOrdersService.findOrderWithLots(existing.id)
        : await this.productionOrdersService.createProductionOrder(
            createDto,
            username,
          );

      results.push({
        planItemId: item.id,
        productId: item.productId,
        quantity: qty,
        lotSize: Number(productionOrder.lotSize),
        totalQrCodes: productionOrder.totalLots,
        productionOrder,
      });
    }

    if (!results.length) {
      throw new BadRequestException(
        'ไม่มีรายการที่สร้างได้ — ตรวจสอบ planItemIds และจำนวนในแต่ละรายการ',
      );
    }

    return {
      planId: plan.id,
      planCode: plan.planCode,
      summary: results.map((r) => ({
        planItemId: r.planItemId,
        productId: r.productId,
        quantity: r.quantity,
        lotSize: r.lotSize,
        totalQrCodes: r.totalQrCodes,
        productionOrderId: r.productionOrder.id,
        orderNo: r.productionOrder.orderNo,
      })),
      orders: results.map((r) =>
        this.serializeProductionOrderForPlanQrResponse(
          r.productionOrder,
          r.planItemId,
        ),
      ),
    };
  }

  async update(id: number, dto: UpdateProductionPlanDto, username: string) {
    const plan = await this.findOne(id);

    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'สามารถแก้ไขได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น',
      );
    }

    Object.assign(plan, {
      planName: dto.planName,
      remarks: dto.remarks,
      updateBy: username,
    });

    if (dto.planDate) {
      plan.planDate = new Date(dto.planDate);
    }

    await this.planRepo.save(plan);

    // Update items if provided
    if (dto.items) {
      // Delete existing items
      await this.itemRepo.delete({ planId: id });

      // Add new items
      for (const item of dto.items) {
        await this.addItem(id, item);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const plan = await this.findOne(id);

    if (plan.status === PlanStatus.CONFIRMED) {
      throw new BadRequestException('ไม่สามารถลบแผนที่ยืนยันแล้ว');
    }

    await this.planRepo.remove(plan);
    return { message: 'ลบแผนการผลิตสำเร็จ' };
  }

  async addItem(planId: number, dto: AddPlanItemDto) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'สามารถเพิ่มรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น',
      );
    }

    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');

    const item = this.itemRepo.create({
      planId,
      productId: dto.productId,
      quantity: dto.quantity,
      unit: dto.unit,
      remarks: dto.remarks,
    });

    return this.itemRepo.save(item);
  }

  async updateItem(
    planId: number,
    itemId: number,
    dto: UpdatePlanItemDto,
    username: string,
  ) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'สามารถแก้ไขรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น',
      );
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId, planId } });
    if (!item) throw new NotFoundException('ไม่พบรายการสินค้า');

    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async removeItem(planId: number, itemId: number) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'สามารถลบรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น',
      );
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId, planId } });
    if (!item) throw new NotFoundException('ไม่พบรายการสินค้า');

    await this.itemRepo.remove(item);
    return { message: 'ลบรายการสินค้าสำเร็จ' };
  }

  async reserveMaterials(planId: number, username: string) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException(
        'สามารถจองได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น',
      );
    }

    if (!plan.items?.length) {
      throw new BadRequestException('กรุณาเพิ่มรายการสินค้าก่อนจอง material');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(MaterialReservation, { planId });

      const materialRequirements = new Map<number, number>();

      for (const item of plan.items) {
        const boms = await this.bomRepo.find({
          where: { productId: item.productId, isActive: true },
        });

        if (!boms || boms.length === 0) {
          const product = await this.productRepo.findOne({
            where: { id: item.productId },
          });
          throw new BadRequestException(
            `สินค้า "${product?.productName || item.productId}" ยังไม่มี BOM (Bill of Materials) กรุณาเพิ่ม BOM ก่อนสร้างแผนการผลิต`,
          );
        }

        for (const bom of boms) {
          const required = Number(bom.quantityPerUnit) * Number(item.quantity);
          const current = materialRequirements.get(bom.materialId) || 0;
          materialRequirements.set(bom.materialId, current + required);
        }
      }

      // ตรวจสอบว่ามีวัตถุดิบเพียงพอทั้งหมดก่อน
      const insufficientMaterials: any[] = [];

      for (const [materialId, requiredQty] of materialRequirements) {
        // ดึงข้อมูลจาก materials_stock ก่อน
        const stock = await queryRunner.manager.findOne(MaterialsStock, {
          where: { materialId },
        });

        let availableQty = 0;

        if (stock) {
          // ใช้ available_qty จาก stock (ยอดที่พร้อมใช้งาน = total - reserved)
          availableQty = Number(stock.availableQty || 0);
        } else {
          // ถ้าไม่มี stock record ให้ตรวจสอบจาก lots
          const totalInLots = await queryRunner.manager
            .createQueryBuilder()
            .select('COALESCE(SUM(remaining_quantity), 0)', 'total')
            .from('material_receiving_lots', 'ml')
            .where('ml.material_id = :materialId', { materialId })
            .andWhere('ml.status IN (:...statuses)', {
              statuses: ['AVAILABLE', 'PARTIAL_USED'],
            })
            .andWhere('ml.remaining_quantity > 0')
            .getRawOne();

          const totalInLotsQty = Number(totalInLots.total);

          // หักยอดที่ถูกจองโดยแผนอื่น (เฉพาะแผนที่อยู่ในสถานะ RESERVED เท่านั้น)
          const existingReservations = await queryRunner.manager.query(
            `SELECT COALESCE(SUM(mr.reserved_quantity), 0) as reserved 
             FROM material_reservations mr
             JOIN production_plans pp ON mr.plan_id = pp.id
             WHERE mr.material_id = $1 AND mr.plan_id != $2 AND pp.status = 'reserved'`,
            [materialId, planId],
          );

          const reservedByOthers = Number(
            existingReservations[0]?.reserved || 0,
          );
          availableQty = totalInLotsQty - reservedByOthers;
        }

        console.log(`[Reserve Check] Material ID: ${materialId}`);
        console.log(`  - Required: ${requiredQty}`);
        console.log(`  - Available (from stock or lots): ${availableQty}`);

        const material = await queryRunner.manager.query(
          'SELECT mat_code, mat_name FROM master.materials WHERE id = $1',
          [materialId],
        );

        // ดึงข้อมูลเพิ่มเติมเพื่อแสดง error ที่ละเอียด
        const stockInfo = stock
          ? {
              totalQty: Number(stock.totalQty),
              availableQty: Number(stock.availableQty),
              reservedQty: Number(stock.reservedQty),
            }
          : null;

        insufficientMaterials.push({
          materialId,
          materialCode: material[0]?.mat_code || `ID-${materialId}`,
          materialName: material[0]?.mat_name || 'Unknown',
          required: requiredQty,
          available: availableQty,
          shortage: Math.max(0, requiredQty - availableQty),
          isInsufficient: availableQty < requiredQty,
          stock: stockInfo,
        });
      }

      // กรองเฉพาะรายการที่ไม่พอ
      const notEnoughMaterials = insufficientMaterials.filter(
        (m) => m.isInsufficient,
      );

      // ถ้ามีวัตถุดิบไม่พอ ให้ rollback และ return รายการทั้งหมด
      if (notEnoughMaterials.length > 0) {
        await queryRunner.rollbackTransaction();

        return {
          success: false,
          canReserve: false,
          message: `วัตถุดิบไม่เพียงพอ (${notEnoughMaterials.length} รายการ)`,
          insufficientMaterials: notEnoughMaterials,
          allMaterials: insufficientMaterials,
        };
      }

      // จองวัตถุดิบแบบ FIFO (บันทึกข้อมูลการจองเท่านั้น ไม่ลด remaining_quantity)
      for (const [materialId, requiredQty] of materialRequirements) {
        let remainingQty = requiredQty;

        const lots = await queryRunner.manager.query(
          `SELECT id, lot_no, remaining_quantity, create_date 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY 
             CAST(RIGHT(lot_no, 3) AS INTEGER) ASC,
             create_date ASC, 
             id ASC`,
          [materialId],
        );

        for (const lot of lots) {
          if (remainingQty <= 0) break;

          const reserveQty = Math.min(
            Number(lot.remaining_quantity),
            remainingQty,
          );

          // บันทึกการจอง (ไม่ลด remaining_quantity ที่นี่)
          await queryRunner.manager.query(
            `INSERT INTO material_reservations 
             (plan_id, material_id, reserved_quantity, lot_number, receive_date, create_date) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [planId, materialId, reserveQty, lot.lot_no, lot.create_date],
          );

          remainingQty -= reserveQty;
        }
      }

      // อัพเดต stock summary (เพิ่ม reserved_qty, ลด available_qty)
      for (const [materialId, requiredQty] of materialRequirements) {
        const stockExists = await queryRunner.manager.query(
          `SELECT material_id FROM materials_stock WHERE material_id = $1`,
          [materialId],
        );

        if (!stockExists || stockExists.length === 0) {
          // ถ้าไม่มี stock record ให้สร้างใหม่
          const totalInLots = await queryRunner.manager.query(
            `SELECT COALESCE(SUM(remaining_quantity), 0) as total
             FROM material_receiving_lots 
             WHERE material_id = $1 AND status IN ('AVAILABLE', 'PARTIAL_USED')`,
            [materialId],
          );
          const totalQty = Number(totalInLots[0]?.total || 0);

          await queryRunner.manager.query(
            `INSERT INTO materials_stock (material_id, total_qty, available_qty, reserved_qty) 
             VALUES ($1, $2, $3, $4)`,
            [materialId, totalQty, totalQty - requiredQty, requiredQty],
          );
        } else {
          await queryRunner.manager.query(
            `UPDATE materials_stock 
             SET available_qty = available_qty - $1, 
                 reserved_qty = reserved_qty + $1 
             WHERE material_id = $2`,
            [requiredQty, materialId],
          );
        }
      }

      plan.status = PlanStatus.RESERVED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
      return {
        success: true,
        canReserve: true,
        message: 'จองวัตถุดิบสำเร็จ',
        plan: await this.findOne(planId),
        allMaterials: insufficientMaterials,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Reserve materials error:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirm(planId: number, username: string) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.RESERVED) {
      throw new BadRequestException(
        'สามารถยืนยันได้เฉพาะแผนที่จอง material แล้ว',
      );
    }

    plan.status = PlanStatus.CONFIRMED;
    plan.updateBy = username;

    return this.planRepo.save(plan);
  }

  async confirmAndIssue(planId: number, username: string) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.RESERVED) {
      throw new BadRequestException(
        'สามารถยืนยันและจ่ายออกได้เฉพาะแผนที่จอง material แล้ว',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservations = await queryRunner.manager.find(MaterialReservation, {
        where: { planId },
        relations: ['material'],
      });

      if (!reservations.length) {
        throw new BadRequestException('ไม่พบข้อมูลการจอง');
      }

      // สร้าง material_issue header
      const issueNo = await this.generateIssueNo(queryRunner);
      const issue = await queryRunner.manager.query(
        `INSERT INTO material_issues 
         (issue_no, issue_date, issue_type, production_order_no, remarks, status, create_date, create_by, update_date, update_by) 
         VALUES ($1, NOW(), 'PRODUCTION', $2, $3, 'COMPLETED', NOW(), $4, NOW(), $4)
         RETURNING id`,
        [
          issueNo,
          plan.planCode,
          `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`,
          username,
        ],
      );

      const issueId = issue[0].id;

      // สร้าง material_issue_items
      for (const reservation of reservations) {
        await queryRunner.manager.query(
          `INSERT INTO material_issue_items 
           (issue_id, material_id, issued_quantity, unit, create_date, create_by) 
           VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [
            issueId,
            reservation.materialId,
            reservation.reservedQuantity,
            reservation.material?.unitMaster?.name || 'unit',
            username,
          ],
        );
      }

      // สร้าง material_issuing และตัดจ่ายออกจาก lots
      for (const reservation of reservations) {
        const issuingNo = await this.generateIssuingNo(queryRunner);
        const issuingType = await queryRunner.manager.query(
          `SELECT id FROM master.issuing_types WHERE code = 'WORK_ORDER' LIMIT 1`,
        );

        const issuing = await queryRunner.manager.query(
          `INSERT INTO material_issuing 
           (issuing_no, material_id, total_quantity, unit, issuing_date, issuing_type_id, 
            remark, status, create_date, create_by) 
           VALUES ($1, $2, $3, $4, NOW(), $5, $6, 'COMPLETED', NOW(), $7)
           RETURNING id`,
          [
            issuingNo,
            reservation.materialId,
            reservation.reservedQuantity,
            reservation.material?.unitMaster?.name || 'unit',
            issuingType[0]?.id,
            `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`,
            username,
          ],
        );

        const issuingId = issuing[0].id;

        // ดึง lots แบบ FIFO และตัดจ่ายออก
        const availableLots = await queryRunner.manager.query(
          `SELECT id, lot_no, qr_code, remaining_quantity 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY 
             CAST(RIGHT(lot_no, 3) AS INTEGER) ASC,
             create_date ASC, 
             id ASC`,
          [reservation.materialId],
        );

        let remainingToIssue = Number(reservation.reservedQuantity);

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(
            Number(lot.remaining_quantity),
            remainingToIssue,
          );

          // บันทึก material_issuing_lots
          await queryRunner.manager.query(
            `INSERT INTO material_issuing_lots 
             (issuing_id, lot_id, qr_code, quantity, unit) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              issuingId,
              lot.id,
              lot.qr_code,
              issueFromThisLot,
              reservation.material?.unitMaster?.name || 'unit',
            ],
          );

          // อัพเดท lot
          const newRemaining =
            Number(lot.remaining_quantity) - issueFromThisLot;
          const newStatus = newRemaining === 0 ? 'USED_UP' : 'PARTIAL_USED';

          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = $1, status = $2 
             WHERE id = $3`,
            [newRemaining, newStatus, lot.id],
          );

          // สร้าง transaction log
          const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${lot.id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          await queryRunner.manager.query(
            `INSERT INTO material_transactions 
             (transaction_no, transaction_type, transaction_date, material_id, lot_id, qr_code, quantity, remaining_quantity, reference_no, remark, create_by) 
             VALUES ($1, 'ISSUE', NOW(), $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              txnNo,
              reservation.materialId,
              lot.id,
              lot.qr_code,
              -issueFromThisLot,
              newRemaining,
              issuingNo,
              `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`,
              username,
            ],
          );

          remainingToIssue -= issueFromThisLot;
        }
      }

      // อัพเดท materials_stock
      const materialTotals = reservations.reduce(
        (acc, r) => {
          const qty = Number(r.reservedQuantity);
          acc[r.materialId] = (acc[r.materialId] || 0) + qty;
          return acc;
        },
        {} as Record<number, number>,
      );

      for (const [materialId, totalQty] of Object.entries(materialTotals)) {
        await queryRunner.manager.query(
          `UPDATE materials_stock 
           SET total_qty = total_qty - $1, 
               reserved_qty = reserved_qty - $1 
           WHERE material_id = $2`,
          [totalQty, materialId],
        );
      }

      // ลบข้อมูลการจอง (สำคัญ: ต้องลบเพราะวัตถุดิบถูกจ่ายออกไปแล้ว)
      await queryRunner.manager.delete(MaterialReservation, { planId });

      // อัพเดทสถานะแผน
      plan.status = PlanStatus.CONFIRMED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();

      console.log(
        `[Confirm & Issue] Plan ${planId} confirmed and materials issued successfully`,
      );

      return this.finalizePlanAfterIssueWithProductionQr(planId, username);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async issueMaterials(planId: number, username: string) {
    const plan = await this.findOne(planId);

    if (plan.status !== PlanStatus.RESERVED) {
      throw new BadRequestException('สามารถจัดงานได้เฉพาะแผนที่จองแล้ว');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservations = await queryRunner.manager.find(MaterialReservation, {
        where: { planId },
      });

      if (!reservations.length) {
        throw new BadRequestException('ไม่พบข้อมูลการจอง');
      }

      // สร้าง material_issue header
      const issueNo = await this.generateIssueNo(queryRunner);
      const issue = await queryRunner.manager.query(
        `INSERT INTO material_issues 
         (issue_no, issue_date, issue_type, production_order_no, remarks, status, create_date, create_by, update_date, update_by) 
         VALUES ($1, NOW(), 'PRODUCTION', $2, $3, 'COMPLETED', NOW(), $4, NOW(), $4)
         RETURNING id`,
        [
          issueNo,
          plan.planCode,
          `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`,
          username,
        ],
      );

      const issueId = issue[0].id;

      for (const reservation of reservations) {
        // สร้าง material_issue_item
        await queryRunner.manager.query(
          `INSERT INTO material_issue_items 
           (issue_id, material_id, issued_quantity, unit, create_date, create_by) 
           VALUES ($1, $2, $3, 'unit', NOW(), $4)`,
          [
            issueId,
            reservation.materialId,
            reservation.reservedQuantity,
            username,
          ],
        );

        // สร้าง material_issuing สำหรับแต่ละ material
        const issuingNo = await this.generateIssuingNo(queryRunner);
        const issuingType = await queryRunner.manager.query(
          `SELECT id FROM master.issuing_types WHERE code = 'WORK_ORDER' LIMIT 1`,
        );

        const issuing = await queryRunner.manager.query(
          `INSERT INTO material_issuing 
           (issuing_no, material_id, total_quantity, unit, issuing_date, issuing_type_id, 
            remark, status, create_date, create_by) 
           VALUES ($1, $2, $3, 'unit', NOW(), $4, $5, 'COMPLETED', NOW(), $6)
           RETURNING id`,
          [
            issuingNo,
            reservation.materialId,
            reservation.reservedQuantity,
            issuingType[0]?.id,
            `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`,
            username,
          ],
        );

        const issuingId = issuing[0].id;

        // ดึง lots แบบ FIFO และตัดจ่ายออก
        const availableLots = await queryRunner.manager.query(
          `SELECT id, lot_no, qr_code, remaining_quantity 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY 
             CAST(RIGHT(lot_no, 3) AS INTEGER) ASC,
             create_date ASC, 
             id ASC`,
          [reservation.materialId],
        );

        let remainingToIssue = Number(reservation.reservedQuantity);

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(
            Number(lot.remaining_quantity),
            remainingToIssue,
          );

          // บันทึก material_issuing_lots
          await queryRunner.manager.query(
            `INSERT INTO material_issuing_lots 
             (issuing_id, lot_id, qr_code, quantity, unit) 
             VALUES ($1, $2, $3, $4, 'unit')`,
            [issuingId, lot.id, lot.qr_code, issueFromThisLot],
          );

          // อัพเดท lot
          const newRemaining =
            Number(lot.remaining_quantity) - issueFromThisLot;
          const newStatus = newRemaining === 0 ? 'USED_UP' : 'PARTIAL_USED';

          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = $1, status = $2 
             WHERE id = $3`,
            [newRemaining, newStatus, lot.id],
          );

          remainingToIssue -= issueFromThisLot;
        }
      }

      const materialTotals = reservations.reduce(
        (acc, r) => {
          const qty = Number(r.reservedQuantity);
          acc[r.materialId] = (acc[r.materialId] || 0) + qty;
          return acc;
        },
        {} as Record<number, number>,
      );

      for (const [materialId, totalQty] of Object.entries(materialTotals)) {
        await queryRunner.manager.query(
          `UPDATE materials_stock 
           SET total_qty = total_qty - $1, 
               reserved_qty = reserved_qty - $1 
           WHERE material_id = $2`,
          [totalQty, materialId],
        );
      }

      // ลบข้อมูลการจอง (สำคัญ: ต้องลบเพราะวัตถแดิบถูกจ่ายออกไปแล้ว)
      await queryRunner.manager.delete(MaterialReservation, { planId });

      plan.status = PlanStatus.CONFIRMED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();

      console.log(
        `[Issue Materials] Plan ${planId} materials issued successfully`,
      );

      return this.finalizePlanAfterIssueWithProductionQr(planId, username);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(planId: number, username: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('ไม่พบแผนการผลิต');

    if (plan.status === PlanStatus.CONFIRMED) {
      throw new BadRequestException('ไม่สามารถยกเลิกแผนที่ยืนยันแล้ว');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (plan.status === PlanStatus.RESERVED) {
        const reservations = await queryRunner.manager.find(
          MaterialReservation,
          { where: { planId } },
        );

        // คืน stock summary (ไม่ต้องคืน remaining_quantity ใน lots เพราะไม่ได้ลดตอนจอง)
        for (const reservation of reservations) {
          const stock = await queryRunner.manager.findOne(MaterialsStock, {
            where: { materialId: reservation.materialId },
            lock: { mode: 'pessimistic_write' },
          });

          if (stock) {
            stock.availableQty += Number(reservation.reservedQuantity);
            stock.reservedQty -= Number(reservation.reservedQuantity);
            await queryRunner.manager.save(stock);
          }
        }

        // ลบข้อมูลการจอง
        await queryRunner.manager.delete(MaterialReservation, { planId });
      }

      plan.status = PlanStatus.CANCELLED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();

      console.log(`[Cancel] Plan ${planId} cancelled successfully`);

      return this.findOne(planId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMaterialAvailability() {
    return this.stockRepo.find({
      relations: ['material'],
      where: { availableQty: MoreThan(0) },
    });
  }

  async getMaterialReservations() {
    const reservations = await this.reservationRepo
      .createQueryBuilder('res')
      .innerJoin('res.material', 'material')
      .innerJoin('res.plan', 'plan')
      .where('plan.status IN (:...statuses)', {
        statuses: [PlanStatus.RESERVED, PlanStatus.CONFIRMED],
      })
      .select([
        'res.materialId',
        'res.reservedQuantity',
        'res.lotNumber',
        'res.receiveDate',
        'material.id',
        'material.matCode',
        'material.matName',
        'plan.planCode',
      ])
      .orderBy('res.materialId', 'ASC')
      .getMany();

    const grouped = reservations.reduce((acc, res) => {
      const key = res.materialId;
      if (!acc[key]) {
        acc[key] = {
          materialId: res.material.id,
          materialCode: res.material.matCode,
          materialName: res.material.matName,
          totalReserved: 0,
          details: [],
        };
      }
      acc[key].totalReserved += Number(res.reservedQuantity);
      acc[key].details.push({
        planCode: res.plan.planCode,
        lotNumber: res.lotNumber,
        quantity: Number(res.reservedQuantity),
        receiveDate: res.receiveDate,
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async fixRemainingQuantity() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('=== Starting Fix Remaining Quantity ===');

      // 1. หาการจองของแผนที่ CONFIRMED แล้ว
      const confirmedReservations = await queryRunner.manager.query(
        `SELECT mr.lot_number, SUM(mr.reserved_quantity) as total_reserved
         FROM material_reservations mr
         JOIN production_plans pp ON mr.plan_id = pp.id
         WHERE pp.status = 'confirmed'
         GROUP BY mr.lot_number`,
      );

      console.log(
        `Found ${confirmedReservations.length} lots with confirmed reservations`,
      );

      // คืนค่า remaining_quantity สำหรับ lots ที่ถูกลดไปแล้ว
      for (const res of confirmedReservations) {
        await queryRunner.manager.query(
          `UPDATE material_receiving_lots 
           SET remaining_quantity = remaining_quantity + $1 
           WHERE lot_no = $2`,
          [res.total_reserved, res.lot_number],
        );
        console.log(
          `Fixed lot ${res.lot_number}: added back ${res.total_reserved}`,
        );
      }

      // 2. ลบการจองของแผนที่ CONFIRMED
      const deleteResult = await queryRunner.manager.query(
        `DELETE FROM material_reservations
         WHERE plan_id IN (SELECT id FROM production_plans WHERE status = 'confirmed')
         RETURNING *`,
      );

      console.log(`Deleted ${deleteResult.length} confirmed reservations`);

      // 3. ซิงค์ข้อมูล materials_stock กับ material_receiving_lots
      const allMaterials = await queryRunner.manager.query(
        `SELECT DISTINCT material_id FROM material_receiving_lots`,
      );

      console.log(`Syncing stock for ${allMaterials.length} materials`);

      for (const mat of allMaterials) {
        const materialId = mat.material_id;

        // คำนวณจำนวนจริงจาก lots
        const lotSummary = await queryRunner.manager.query(
          `SELECT 
             COALESCE(SUM(received_quantity), 0) as total_received,
             COALESCE(SUM(remaining_quantity), 0) as total_remaining
           FROM material_receiving_lots 
           WHERE material_id = $1 AND status IN ('AVAILABLE', 'PARTIAL_USED')`,
          [materialId],
        );

        // คำนวณจำนวนที่ถูกจองจริง (เฉพาะแผนที่ RESERVED)
        const reservedSummary = await queryRunner.manager.query(
          `SELECT COALESCE(SUM(mr.reserved_quantity), 0) as total_reserved
           FROM material_reservations mr
           JOIN production_plans pp ON mr.plan_id = pp.id
           WHERE mr.material_id = $1 AND pp.status = 'reserved'`,
          [materialId],
        );

        const totalRemaining = Number(lotSummary[0].total_remaining);
        const totalReserved = Number(reservedSummary[0].total_reserved);
        const totalQty = totalRemaining; // total_qty = remaining ใน lots
        const availableQty = totalRemaining - totalReserved;

        // อัพเดท materials_stock
        const stockExists = await queryRunner.manager.query(
          `SELECT material_id FROM materials_stock WHERE material_id = $1`,
          [materialId],
        );

        if (stockExists && stockExists.length > 0) {
          await queryRunner.manager.query(
            `UPDATE materials_stock 
             SET total_qty = $1, available_qty = $2, reserved_qty = $3
             WHERE material_id = $4`,
            [totalQty, availableQty, totalReserved, materialId],
          );
          console.log(
            `Updated stock for material ${materialId}: total=${totalQty}, available=${availableQty}, reserved=${totalReserved}`,
          );
        } else {
          await queryRunner.manager.query(
            `INSERT INTO materials_stock (material_id, total_qty, available_qty, reserved_qty)
             VALUES ($1, $2, $3, $4)`,
            [materialId, totalQty, availableQty, totalReserved],
          );
          console.log(
            `Created stock for material ${materialId}: total=${totalQty}, available=${availableQty}, reserved=${totalReserved}`,
          );
        }
      }

      await queryRunner.commitTransaction();

      console.log('=== Fix Completed Successfully ===');

      return {
        success: true,
        message: 'แก้ไขข้อมูล remaining_quantity และซิงค์ stock สำเร็จ',
        lotsFixed: confirmedReservations.length,
        reservationsDeleted: deleteResult.length,
        materialsUpdated: allMaterials.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Fix remaining quantity error:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async debugMaterialData(materialCode: string) {
    try {
      // หา material ID
      const material = await this.dataSource.query(
        `SELECT id, mat_code, mat_name FROM master.materials WHERE mat_code = $1 OR mat_name LIKE $2`,
        [materialCode, `%${materialCode}%`],
      );

      if (!material || material.length === 0) {
        return { error: 'ไม่พบวัตถุดิบ', materialCode };
      }

      const materialId = material[0].id;

      // ข้อมูล stock
      const stock = await this.dataSource.query(
        `SELECT * FROM materials_stock WHERE material_id = $1`,
        [materialId],
      );

      // ข้อมูล lots
      const lots = await this.dataSource.query(
        `SELECT id, lot_no, qr_code, quantity as received_quantity, remaining_quantity, status, create_date
         FROM material_receiving_lots 
         WHERE material_id = $1
         ORDER BY create_date`,
        [materialId],
      );

      // ข้อมูลการจอง
      const reservations = await this.dataSource.query(
        `SELECT mr.*, pp.plan_code, pp.status as plan_status
         FROM material_reservations mr
         JOIN production_plans pp ON mr.plan_id = pp.id
         WHERE mr.material_id = $1
         ORDER BY mr.create_date`,
        [materialId],
      );

      // ข้อมูล transactions
      const transactions = await this.dataSource.query(
        `SELECT mt.*, ml.lot_no
         FROM material_transactions mt
         LEFT JOIN material_receiving_lots ml ON mt.lot_id = ml.id
         WHERE mt.material_id = $1
         ORDER BY mt.transaction_date DESC
         LIMIT 20`,
        [materialId],
      );

      return {
        material: material[0],
        stock: stock[0] || null,
        lots,
        reservations,
        transactions,
        summary: {
          totalLots: lots.length,
          totalReceived: lots.reduce(
            (sum, lot) => sum + Number(lot.received_quantity),
            0,
          ),
          totalRemaining: lots.reduce(
            (sum, lot) => sum + Number(lot.remaining_quantity),
            0,
          ),
          totalReserved: reservations.reduce(
            (sum, r) => sum + Number(r.reserved_quantity),
            0,
          ),
          activeReservations: reservations.filter(
            (r) => r.plan_status === 'reserved',
          ).length,
          confirmedReservations: reservations.filter(
            (r) => r.plan_status === 'confirmed',
          ).length,
        },
      };
    } catch (error) {
      console.error('Debug material error:', error);
      throw error;
    }
  }

  async checkMaterialAvailability(materialId: number) {
    try {
      // ดึงข้อมูลวัตถุดิบ
      const material = await this.dataSource.query(
        `SELECT id, mat_code, mat_name FROM master.materials WHERE id = $1`,
        [materialId],
      );

      if (!material || material.length === 0) {
        return { error: 'ไม่พบวัตถุดิบ', materialId };
      }

      // ยอดคงเหลือจาก lots
      const lotsData = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(remaining_quantity), 0) as total_remaining,
           COUNT(*) as lot_count
         FROM material_receiving_lots 
         WHERE material_id = $1 
         AND status IN ('AVAILABLE', 'PARTIAL_USED') 
         AND remaining_quantity > 0`,
        [materialId],
      );

      // ยอดที่ถูกจองโดยแผนที่อยู่ในสถานะ RESERVED
      const reservedData = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(mr.reserved_quantity), 0) as total_reserved,
           COUNT(DISTINCT mr.plan_id) as plan_count
         FROM material_reservations mr
         JOIN production_plans pp ON mr.plan_id = pp.id
         WHERE mr.material_id = $1 AND pp.status = 'reserved'`,
        [materialId],
      );

      // ยอดที่ถูกจองโดยแผนทั้งหมด (รวม CONFIRMED)
      const allReservedData = await this.dataSource.query(
        `SELECT 
           COALESCE(SUM(mr.reserved_quantity), 0) as total_reserved,
           COUNT(DISTINCT mr.plan_id) as plan_count
         FROM material_reservations mr
         WHERE mr.material_id = $1`,
        [materialId],
      );

      // ข้อมูลจาก materials_stock
      const stockData = await this.dataSource.query(
        `SELECT * FROM materials_stock WHERE material_id = $1`,
        [materialId],
      );

      const totalInLots = Number(lotsData[0]?.total_remaining || 0);
      const reservedByReservedPlans = Number(
        reservedData[0]?.total_reserved || 0,
      );
      const reservedByAllPlans = Number(
        allReservedData[0]?.total_reserved || 0,
      );
      const available = totalInLots - reservedByReservedPlans;

      return {
        material: material[0],
        calculation: {
          totalInLots,
          reservedByReservedPlans,
          reservedByAllPlans,
          available,
          formula: `${totalInLots} (in lots) - ${reservedByReservedPlans} (reserved by RESERVED plans) = ${available}`,
        },
        lotsInfo: {
          count: lotsData[0]?.lot_count || 0,
          totalRemaining: totalInLots,
        },
        reservationsInfo: {
          reservedPlansCount: reservedData[0]?.plan_count || 0,
          allPlansCount: allReservedData[0]?.plan_count || 0,
          reservedByReservedPlans,
          reservedByAllPlans,
        },
        stockTable: stockData[0] || null,
      };
    } catch (error) {
      console.error('Check material availability error:', error);
      throw error;
    }
  }

  async fixLotsFromStock() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('=== Fixing Lots from Stock ===');

      // หา lots ที่ remaining_quantity = 0 แต่ received_quantity > 0
      const brokenLots = await queryRunner.manager.query(
        `SELECT 
           ml.id,
           ml.material_id,
           m.mat_code,
           m.mat_name,
           ml.lot_no,
           ml.received_quantity,
           ml.remaining_quantity,
           ml.status
         FROM material_receiving_lots ml
         JOIN master.materials m ON ml.material_id = m.id
         WHERE ml.remaining_quantity = 0 
           AND ml.received_quantity > 0
           AND ml.status IN ('AVAILABLE', 'PARTIAL_USED')
         ORDER BY ml.material_id, ml.lot_no`,
      );

      console.log(`Found ${brokenLots.length} broken lots to fix`);

      let fixedCount = 0;

      for (const lot of brokenLots) {
        // ตรวจสอบว่ามีการจ่ายออกจริงหรือไม่
        const issued = await queryRunner.manager.query(
          `SELECT COALESCE(SUM(ABS(quantity)), 0) as total_issued
           FROM material_transactions
           WHERE lot_id = $1 AND transaction_type = 'ISSUE'`,
          [lot.id],
        );

        const totalIssued = Number(issued[0]?.total_issued || 0);
        const shouldRemaining = Number(lot.received_quantity) - totalIssued;

        if (shouldRemaining > 0) {
          // แก้ไข remaining_quantity
          await queryRunner.manager.query(
            `UPDATE material_receiving_lots
             SET remaining_quantity = $1,
                 status = CASE 
                   WHEN $1 = received_quantity THEN 'AVAILABLE'
                   WHEN $1 > 0 THEN 'PARTIAL_USED'
                   ELSE 'USED_UP'
                 END
             WHERE id = $2`,
            [shouldRemaining, lot.id],
          );

          console.log(
            `Fixed lot ${lot.lot_no} (${lot.mat_code}): set remaining to ${shouldRemaining}`,
          );
          fixedCount++;
        }
      }

      // อัพเดท materials_stock ให้ตรงกับ lots
      const allMaterials = await queryRunner.manager.query(
        `SELECT DISTINCT material_id FROM material_receiving_lots`,
      );

      for (const mat of allMaterials) {
        const materialId = mat.material_id;

        const lotSummary = await queryRunner.manager.query(
          `SELECT 
             COALESCE(SUM(remaining_quantity), 0) as total_remaining
           FROM material_receiving_lots 
           WHERE material_id = $1 AND status IN ('AVAILABLE', 'PARTIAL_USED')`,
          [materialId],
        );

        const reservedSummary = await queryRunner.manager.query(
          `SELECT COALESCE(SUM(mr.reserved_quantity), 0) as total_reserved
           FROM material_reservations mr
           JOIN production_plans pp ON mr.plan_id = pp.id
           WHERE mr.material_id = $1 AND pp.status = 'reserved'`,
          [materialId],
        );

        const totalRemaining = Number(lotSummary[0].total_remaining);
        const totalReserved = Number(reservedSummary[0].total_reserved);
        const availableQty = totalRemaining - totalReserved;

        await queryRunner.manager.query(
          `INSERT INTO materials_stock (material_id, total_qty, available_qty, reserved_qty)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (material_id) 
           DO UPDATE SET 
             total_qty = $2,
             available_qty = $3,
             reserved_qty = $4`,
          [materialId, totalRemaining, availableQty, totalReserved],
        );
      }

      await queryRunner.commitTransaction();

      console.log('=== Fix Completed ===');

      return {
        success: true,
        message: 'แก้ไข lots และซิงค์ stock สำเร็จ',
        lotsFixed: fixedCount,
        materialsUpdated: allMaterials.length,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Fix lots from stock error:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPlanDetails(planId: number) {
    const plan = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['items', 'items.product'],
    });

    if (!plan) throw new NotFoundException('ไม่พบแผนการผลิต');

    const itemsOrdered = [...(plan.items ?? [])].sort((a, b) => a.id - b.id);

    const details: any[] = [];

    for (const item of itemsOrdered) {
      const boms = await this.bomRepo.find({
        where: { productId: item.productId, isActive: true },
        relations: ['material'],
        order: { sequenceOrder: 'ASC' },
      });

      const materials: any[] = [];
      for (const bom of boms) {
        const requiredQty = Number(bom.quantityPerUnit) * Number(item.quantity);

        // ดึงจำนวนจริงจาก material_receiving_lots (ไม่รวมที่ถูกจองโดยแผนอื่น)
        const lotTotal = await this.dataSource.query(
          `SELECT COALESCE(SUM(remaining_quantity), 0) as available
           FROM material_receiving_lots 
           WHERE material_id = $1 AND status IN ('AVAILABLE', 'PARTIAL_USED') AND remaining_quantity > 0`,
          [bom.materialId],
        );

        const stock = await this.stockRepo.findOne({
          where: { materialId: bom.materialId },
        });

        materials.push({
          materialId: bom.material.id,
          materialCode: bom.material.matCode,
          materialName: bom.material.matName,
          quantityPerUnit: Number(bom.quantityPerUnit),
          requiredQuantity: requiredQty,
          unit: bom.unit,
          availableQty: Number(lotTotal[0]?.available || 0), // จำนวนที่ใช้ได้จริง (ไม่รวมที่ถูกจอง)
          reservedQty: stock?.reservedQty || 0,
          totalQty: stock?.totalQty || 0,
        });
      }

      details.push({
        /** เท่ากับ production_plan_items.id — ใช้กับ production_orders.plan_item_id และ summary.planItemId */
        id: item.id,
        planItemId: item.id,
        productId: item.product.id,
        productCode: item.product.productCode,
        productName: item.product.productName,
        quantity: Number(item.quantity),
        unit: item.unit,
        materials,
      });
    }

    let reservations = await this.dataSource.query(
      `SELECT 
        mr.material_id,
        m.mat_code as material_code,
        m.mat_name as material_name,
        mr.reserved_quantity,
        mr.lot_number,
        ml.lot_pd_no,
        ml.qr_code,
        mr.receive_date,
        mr.create_date
      FROM material_reservations mr
      JOIN master.materials m ON mr.material_id = m.id
      LEFT JOIN material_receiving_lots ml ON mr.lot_number = ml.lot_no
      WHERE mr.plan_id = $1
      ORDER BY m.mat_code, mr.receive_date`,
      [planId],
    );

    const planIssueRemark = this.planIssueRemark(plan.planCode);

    /** หลัง confirm/issue แถว material_reservations ถูกลบ — ดึง Lot/QR จากงานจ่ายจริงสำหรับใบจัด */
    if (!reservations.length && plan.status === PlanStatus.CONFIRMED) {
      reservations = await this.dataSource.query(
        `SELECT 
          mis.material_id,
          m.mat_code as material_code,
          m.mat_name as material_name,
          mil.quantity as reserved_quantity,
          mrl.lot_no as lot_number,
          mrl.lot_pd_no,
          COALESCE(NULLIF(TRIM(mil.qr_code), ''), mrl.qr_code) as qr_code,
          mrl.income_supplire_date as receive_date,
          mil.create_date
        FROM material_issuing mis
        INNER JOIN material_issuing_lots mil ON mil.issuing_id = mis.id
        INNER JOIN material_receiving_lots mrl ON mrl.id = mil.lot_id
        INNER JOIN master.materials m ON m.id = mis.material_id
        WHERE mis.remark = $1
        ORDER BY m.mat_code, mil.create_date, mrl.lot_no`,
        [planIssueRemark],
      );
    }

    const issuerMap = await this.getMaterialIssuedByMapForPlanCodes([
      plan.planCode,
    ]);
    const materialIssuedBy = issuerMap.get(plan.planCode) ?? [];

    return {
      id: plan.id,
      planId: plan.id,
      planCode: plan.planCode,
      planName: plan.planName,
      planDate: plan.planDate,
      status: plan.status,
      remarks: plan.remarks,
      createDate: plan.createDate,
      createBy: plan.createBy,
      materialIssuedBy,
      items: details,
      reservations: reservations.map((r) => ({
        materialId: r.material_id,
        materialCode: r.material_code,
        materialName: r.material_name,
        reservedQuantity: Number(r.reserved_quantity),
        lotNumber: r.lot_number,
        lotPdNo: r.lot_pd_no,
        qrCode: r.qr_code,
        receiveDate: r.receive_date,
        createDate: r.create_date,
      })),
    };
  }

  /**
   * หลังจ่ายวัตถุดิบและยืนยันแผนแล้ว — สร้าง QR ล็อตผลิตใน DB (เหมือน flow รับเข้า material)
   * คืนแผนพร้อม productionQrGeneration สำหรับให้หน้าบ้านซิงก์ tracking
   */
  private async finalizePlanAfterIssueWithProductionQr(
    planId: number,
    username: string,
  ) {
    const planOut = await this.findOne(planId);
    try {
      const productionQrGeneration = await this.generateProductQrOrdersFromPlan(
        planId,
        {},
        username,
      );
      return Object.assign(planOut, {
        productionQrGeneration,
        productionQrGenerationError: null as string | null,
      });
    } catch (e: unknown) {
      const productionQrGenerationError =
        e instanceof Error ? e.message : String(e);
      console.error(
        `[finalizePlanAfterIssueWithProductionQr] plan ${planId}:`,
        e,
      );
      return Object.assign(planOut, {
        productionQrGeneration: null,
        productionQrGenerationError,
      });
    }
  }

  /**
   * คืน JSON ชัดเจน — รับประกัน orders[].lots[] พร้อม qrCode หลังบันทึก production_lots
   * planItemId สอดคล้อง summary.planItemId และ GET .../details items[].id / planItemId
   */
  private serializeProductionOrderForPlanQrResponse(
    order: ProductionOrder,
    planItemId: number,
  ) {
    const lots = [...(order.lots ?? [])].sort(
      (a, b) => Number(a.sequenceNo) - Number(b.sequenceNo),
    );
    return {
      id: order.id,
      orderNo: order.orderNo,
      planId: order.planId ?? null,
      planItemId,
      productId: order.productId,
      orderQuantity: Number(order.orderQuantity),
      lotSize: Number(order.lotSize),
      totalLots: order.totalLots,
      status: order.status,
      remarks: order.remarks ?? null,
      createDate: order.createDate,
      lots: lots.map((lot) => ({
        id: lot.id,
        orderId: lot.orderId,
        lotNo: lot.lotNo,
        lotPdNo: lot.lotPdNo ?? null,
        orderLotLabel: lot.orderLotLabel ?? null,
        qrCode: lot.qrCode,
        sequenceNo: lot.sequenceNo,
        quantity: Number(lot.quantity),
        status: lot.status,
        currentProcessId: lot.currentProcessId ?? null,
      })),
    };
  }

  private async generatePlanCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PP${year}${month}`;

    const lastPlan = await this.planRepo
      .createQueryBuilder('plan')
      .where('plan.planCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('plan.planCode', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastPlan) {
      const lastSequence = parseInt(lastPlan.planCode.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private async generateIssuingNo(queryRunner: any): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `ISS${year}${month}`;

    const lastIssuing = await queryRunner.manager.query(
      `SELECT issuing_no FROM material_issuing 
       WHERE issuing_no LIKE $1 
       ORDER BY issuing_no DESC LIMIT 1`,
      [`${prefix}%`],
    );

    let sequence = 1;
    if (lastIssuing && lastIssuing[0]) {
      const lastSequence = parseInt(lastIssuing[0].issuing_no.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private async generateIssueNo(queryRunner: any): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `ISS-${year}${month}`;

    const lastIssue = await queryRunner.manager.query(
      `SELECT issue_no FROM material_issues 
       WHERE issue_no LIKE $1 
       ORDER BY issue_no DESC LIMIT 1`,
      [`${prefix}%`],
    );

    let sequence = 1;
    if (lastIssue && lastIssue[0]) {
      const lastSeq = parseInt(lastIssue[0].issue_no.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
