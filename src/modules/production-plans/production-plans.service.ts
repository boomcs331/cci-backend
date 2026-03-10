import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, In } from 'typeorm';
import { ProductionPlan, ProductionPlanItem, MaterialReservation, PlanStatus } from './entities';
import { Product, ProductBom } from '../products/entities';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';
import { CreateProductionPlanDto, UpdateProductionPlanDto, AddPlanItemDto, UpdatePlanItemDto } from './dto';

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

  async findAll() {
    return this.planRepo.find({
      relations: ['items', 'items.product'],
      order: { createDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!plan) throw new NotFoundException('ไม่พบแผนการผลิต');
    return plan;
  }

  async update(id: number, dto: UpdateProductionPlanDto, username: string) {
    const plan = await this.findOne(id);
    
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('สามารถแก้ไขได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น');
    }

    Object.assign(plan, {
      planName: dto.planName,
      remarks: dto.remarks,
      updateBy: username
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
      throw new BadRequestException('สามารถเพิ่มรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น');
    }

    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
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

  async updateItem(planId: number, itemId: number, dto: UpdatePlanItemDto, username: string) {
    const plan = await this.findOne(planId);
    
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('สามารถแก้ไขรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น');
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId, planId } });
    if (!item) throw new NotFoundException('ไม่พบรายการสินค้า');

    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async removeItem(planId: number, itemId: number) {
    const plan = await this.findOne(planId);
    
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('สามารถลบรายการได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น');
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId, planId } });
    if (!item) throw new NotFoundException('ไม่พบรายการสินค้า');

    await this.itemRepo.remove(item);
    return { message: 'ลบรายการสินค้าสำเร็จ' };
  }

  async reserveMaterials(planId: number, username: string) {
    const plan = await this.findOne(planId);
    
    if (plan.status !== PlanStatus.DRAFT) {
      throw new BadRequestException('สามารถจองได้เฉพาะแผนที่อยู่ในสถานะ draft เท่านั้น');
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
          const product = await this.productRepo.findOne({ where: { id: item.productId } });
          throw new BadRequestException(
            `สินค้า "${product?.productName || item.productId}" ยังไม่มี BOM (Bill of Materials) กรุณาเพิ่ม BOM ก่อนสร้างแผนการผลิต`
          );
        }

        for (const bom of boms) {
          const required = Number(bom.quantityPerUnit) * Number(item.quantity);
          const current = materialRequirements.get(bom.materialId) || 0;
          materialRequirements.set(bom.materialId, current + required);
        }
      }

      // ตรวจสอบว่ามีวัตถุดิบเพียงพอทั้งหมดก่อน
      for (const [materialId, requiredQty] of materialRequirements) {
        const totalAvailable = await queryRunner.manager
          .createQueryBuilder()
          .select('COALESCE(SUM(remaining_quantity), 0)', 'total')
          .from('material_receiving_lots', 'ml')
          .where('ml.material_id = :materialId', { materialId })
          .andWhere('ml.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
          .andWhere('ml.remaining_quantity > 0')
          .getRawOne();

        if (!totalAvailable || Number(totalAvailable.total) < requiredQty) {
          const material = await queryRunner.manager.query(
            'SELECT mat_name FROM materials WHERE id = $1',
            [materialId]
          );
          throw new BadRequestException(
            `วัตถุดิบ "${material[0]?.mat_name || materialId}" มีจำนวนไม่เพียงพอ (ต้องการ: ${requiredQty}, มีอยู่: ${totalAvailable?.total || 0})\n\nกรุณาเพิ่มวัตถุดิบโดยการรับเข้าคลัง (Material Receiving) ก่อนทำการจอง`
          );
        }
      }

      // จองวัตถุดิบแบบ FIFO
      for (const [materialId, requiredQty] of materialRequirements) {
        let remainingQty = requiredQty;

        const lots = await queryRunner.manager.query(
          `SELECT id, lot_no, remaining_quantity, create_date 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY create_date ASC, id ASC`,
          [materialId]
        );

        for (const lot of lots) {
          if (remainingQty <= 0) break;

          const reserveQty = Math.min(Number(lot.remaining_quantity), remainingQty);

          await queryRunner.manager.query(
            `INSERT INTO material_reservations 
             (plan_id, material_id, reserved_quantity, lot_number, receive_date, create_date) 
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [planId, materialId, reserveQty, lot.lot_no, lot.create_date]
          );

          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = remaining_quantity - $1 
             WHERE id = $2`,
            [reserveQty, lot.id]
          );

          remainingQty -= reserveQty;
        }
      }

      // อัพเดต stock summary (ตรวจสอบว่ามี record ก่อน ถ้าไม่มีให้ insert)
      for (const [materialId, requiredQty] of materialRequirements) {
        const stockExists = await queryRunner.manager.query(
          `SELECT material_id FROM materials_stock WHERE material_id = $1`,
          [materialId]
        );

        if (!stockExists || stockExists.length === 0) {
          await queryRunner.manager.query(
            `INSERT INTO materials_stock (material_id, total_qty, available_qty, reserved_qty) 
             VALUES ($1, 0, 0, $2)`,
            [materialId, requiredQty]
          );
        } else {
          await queryRunner.manager.query(
            `UPDATE materials_stock 
             SET available_qty = available_qty - $1, 
                 reserved_qty = reserved_qty + $1 
             WHERE material_id = $2`,
            [requiredQty, materialId]
          );
        }
      }

      plan.status = PlanStatus.RESERVED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
      return this.findOne(planId);
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
      throw new BadRequestException('สามารถยืนยันได้เฉพาะแผนที่จอง material แล้ว');
    }

    plan.status = PlanStatus.CONFIRMED;
    plan.updateBy = username;
    
    return this.planRepo.save(plan);
  }

  async confirmAndIssue(planId: number, username: string) {
    const plan = await this.findOne(planId);
    
    if (plan.status !== PlanStatus.RESERVED) {
      throw new BadRequestException('สามารถยืนยันและจ่ายออกได้เฉพาะแผนที่จอง material แล้ว');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservations = await queryRunner.manager.find(MaterialReservation, {
        where: { planId },
        relations: ['material']
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
        [issueNo, plan.planCode, `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`, username]
      );

      const issueId = issue[0].id;

      // สร้าง material_issue_items
      for (const reservation of reservations) {
        await queryRunner.manager.query(
          `INSERT INTO material_issue_items 
           (issue_id, material_id, issued_quantity, unit, create_date, create_by) 
           VALUES ($1, $2, $3, $4, NOW(), $5)`,
          [issueId, reservation.materialId, reservation.reservedQuantity, reservation.material?.unitMaster?.name || 'unit', username]
        );
      }

      // สร้าง material_issuing และตัดจ่ายออกจาก lots
      for (const reservation of reservations) {
        const issuingNo = await this.generateIssuingNo(queryRunner);
        const issuingType = await queryRunner.manager.query(
          `SELECT id FROM issuing_types WHERE code = 'WORK_ORDER' LIMIT 1`
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
            username
          ]
        );

        const issuingId = issuing[0].id;

        // ดึง lots แบบ FIFO และตัดจ่ายออก
        const availableLots = await queryRunner.manager.query(
          `SELECT id, lot_no, qr_code, remaining_quantity 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY create_date ASC, id ASC`,
          [reservation.materialId]
        );

        let remainingToIssue = Number(reservation.reservedQuantity);

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remaining_quantity), remainingToIssue);

          // บันทึก material_issuing_lots
          await queryRunner.manager.query(
            `INSERT INTO material_issuing_lots 
             (issuing_id, lot_id, qr_code, quantity, unit) 
             VALUES ($1, $2, $3, $4, $5)`,
            [issuingId, lot.id, lot.qr_code, issueFromThisLot, reservation.material?.unitMaster?.name || 'unit']
          );

          // อัพเดท lot
          const newRemaining = Number(lot.remaining_quantity) - issueFromThisLot;
          const newStatus = newRemaining === 0 ? 'USED_UP' : 'PARTIAL_USED';
          
          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = $1, status = $2 
             WHERE id = $3`,
            [newRemaining, newStatus, lot.id]
          );

          // สร้าง transaction log
          const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${lot.id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          await queryRunner.manager.query(
            `INSERT INTO material_transactions 
             (transaction_no, transaction_type, transaction_date, material_id, lot_id, qr_code, quantity, remaining_quantity, reference_no, remark, create_by) 
             VALUES ($1, 'ISSUE', NOW(), $2, $3, $4, $5, $6, $7, $8, $9)`,
            [txnNo, reservation.materialId, lot.id, lot.qr_code, -issueFromThisLot, newRemaining, issuingNo, `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`, username]
          );

          remainingToIssue -= issueFromThisLot;
        }
      }

      // อัพเดท materials_stock
      const materialTotals = reservations.reduce((acc, r) => {
        const qty = Number(r.reservedQuantity);
        acc[r.materialId] = (acc[r.materialId] || 0) + qty;
        return acc;
      }, {} as Record<number, number>);

      for (const [materialId, totalQty] of Object.entries(materialTotals)) {
        await queryRunner.manager.query(
          `UPDATE materials_stock 
           SET total_qty = total_qty - $1, 
               reserved_qty = reserved_qty - $1 
           WHERE material_id = $2`,
          [totalQty, materialId]
        );
      }

      // ลบข้อมูลการจอง
      await queryRunner.manager.delete(MaterialReservation, { planId });

      // อัพเดทสถานะแผน
      plan.status = PlanStatus.CONFIRMED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
      return this.findOne(planId);
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
        where: { planId }
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
        [issueNo, plan.planCode, `จ่ายออกสำหรับแผนการผลิต ${plan.planCode}`, username]
      );

      const issueId = issue[0].id;

      for (const reservation of reservations) {
        // สร้าง material_issue_item
        await queryRunner.manager.query(
          `INSERT INTO material_issue_items 
           (issue_id, material_id, issued_quantity, unit, create_date, create_by) 
           VALUES ($1, $2, $3, 'unit', NOW(), $4)`,
          [issueId, reservation.materialId, reservation.reservedQuantity, username]
        );

        // สร้าง material_issuing สำหรับแต่ละ material
        const issuingNo = await this.generateIssuingNo(queryRunner);
        const issuingType = await queryRunner.manager.query(
          `SELECT id FROM issuing_types WHERE code = 'WORK_ORDER' LIMIT 1`
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
            username
          ]
        );

        const issuingId = issuing[0].id;

        // ดึง lots แบบ FIFO และตัดจ่ายออก
        const availableLots = await queryRunner.manager.query(
          `SELECT id, lot_no, qr_code, remaining_quantity 
           FROM material_receiving_lots 
           WHERE material_id = $1 
           AND status IN ('AVAILABLE', 'PARTIAL_USED') 
           AND remaining_quantity > 0 
           ORDER BY create_date ASC, id ASC`,
          [reservation.materialId]
        );

        let remainingToIssue = Number(reservation.reservedQuantity);

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remaining_quantity), remainingToIssue);

          // บันทึก material_issuing_lots
          await queryRunner.manager.query(
            `INSERT INTO material_issuing_lots 
             (issuing_id, lot_id, qr_code, quantity, unit) 
             VALUES ($1, $2, $3, $4, 'unit')`,
            [issuingId, lot.id, lot.qr_code, issueFromThisLot]
          );

          // อัพเดท lot
          const newRemaining = Number(lot.remaining_quantity) - issueFromThisLot;
          const newStatus = newRemaining === 0 ? 'USED_UP' : 'PARTIAL_USED';
          
          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = $1, status = $2 
             WHERE id = $3`,
            [newRemaining, newStatus, lot.id]
          );

          remainingToIssue -= issueFromThisLot;
        }
      }

      const materialTotals = reservations.reduce((acc, r) => {
        const qty = Number(r.reservedQuantity);
        acc[r.materialId] = (acc[r.materialId] || 0) + qty;
        return acc;
      }, {} as Record<number, number>);

      for (const [materialId, totalQty] of Object.entries(materialTotals)) {
        await queryRunner.manager.query(
          `UPDATE materials_stock 
           SET total_qty = total_qty - $1, 
               reserved_qty = reserved_qty - $1 
           WHERE material_id = $2`,
          [totalQty, materialId]
        );
      }

      await queryRunner.manager.delete(MaterialReservation, { planId });

      plan.status = PlanStatus.CONFIRMED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
      return this.findOne(planId);
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
        const reservations = await queryRunner.manager.find(MaterialReservation, { where: { planId } });
        
        for (const reservation of reservations) {
          // คืนจำนวนให้ material_receiving_lots
          await queryRunner.manager.query(
            `UPDATE material_receiving_lots 
             SET remaining_quantity = remaining_quantity + $1 
             WHERE lot_no = $2`,
            [reservation.reservedQuantity, reservation.lotNumber]
          );

          // คืนจำนวนให้ materials_stock
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

        await queryRunner.manager.delete(MaterialReservation, { planId });
      }

      plan.status = PlanStatus.CANCELLED;
      plan.updateBy = username;
      await queryRunner.manager.save(plan);

      await queryRunner.commitTransaction();
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
      .where('plan.status IN (:...statuses)', { statuses: [PlanStatus.RESERVED, PlanStatus.CONFIRMED] })
      .select([
        'res.materialId',
        'res.reservedQuantity',
        'res.lotNumber',
        'res.receiveDate',
        'material.id',
        'material.matCode',
        'material.matName',
        'plan.planCode'
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
          details: []
        };
      }
      acc[key].totalReserved += Number(res.reservedQuantity);
      acc[key].details.push({
        planCode: res.plan.planCode,
        lotNumber: res.lotNumber,
        quantity: Number(res.reservedQuantity),
        receiveDate: res.receiveDate
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async getPlanDetails(planId: number) {
    const plan = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['items', 'items.product']
    });

    if (!plan) throw new NotFoundException('ไม่พบแผนการผลิต');

    const details: any[] = [];

    for (const item of plan.items) {
      const boms = await this.bomRepo.find({
        where: { productId: item.productId, isActive: true },
        relations: ['material'],
        order: { sequenceOrder: 'ASC' }
      });

      const materials: any[] = [];
      for (const bom of boms) {
        const requiredQty = Number(bom.quantityPerUnit) * Number(item.quantity);
        
        // ดึงจำนวนจริงจาก material_receiving_lots
        const lotTotal = await this.dataSource.query(
          `SELECT COALESCE(SUM(remaining_quantity), 0) as available
           FROM material_receiving_lots 
           WHERE material_id = $1 AND status IN ('AVAILABLE', 'PARTIAL_USED') AND remaining_quantity > 0`,
          [bom.materialId]
        );

        const stock = await this.stockRepo.findOne({
          where: { materialId: bom.materialId }
        });

        materials.push({
          materialId: bom.material.id,
          materialCode: bom.material.matCode,
          materialName: bom.material.matName,
          quantityPerUnit: Number(bom.quantityPerUnit),
          requiredQuantity: requiredQty,
          unit: bom.unit,
          availableQty: Number(lotTotal[0]?.available || 0),
          reservedQty: stock?.reservedQty || 0,
          totalQty: stock?.totalQty || 0
        });
      }

      details.push({
        productId: item.product.id,
        productCode: item.product.productCode,
        productName: item.product.productName,
        quantity: Number(item.quantity),
        unit: item.unit,
        materials
      });
    }

    const reservations = await this.dataSource.query(
      `SELECT 
        mr.material_id,
        m.mat_code as material_code,
        m.mat_name as material_name,
        mr.reserved_quantity,
        mr.lot_number,
        ml.qr_code,
        mr.receive_date,
        mr.create_date
      FROM material_reservations mr
      JOIN materials m ON mr.material_id = m.id
      LEFT JOIN material_receiving_lots ml ON mr.lot_number = ml.lot_no
      WHERE mr.plan_id = $1
      ORDER BY m.mat_code, mr.receive_date`,
      [planId]
    );

    return {
      planId: plan.id,
      planCode: plan.planCode,
      planName: plan.planName,
      planDate: plan.planDate,
      status: plan.status,
      remarks: plan.remarks,
      items: details,
      reservations: reservations.map(r => ({
        materialId: r.material_id,
        materialCode: r.material_code,
        materialName: r.material_name,
        reservedQuantity: Number(r.reserved_quantity),
        lotNumber: r.lot_number,
        qrCode: r.qr_code,
        receiveDate: r.receive_date,
        createDate: r.create_date
      }))
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
      [`${prefix}%`]
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
      [`${prefix}%`]
    );

    let sequence = 1;
    if (lastIssue && lastIssue[0]) {
      const lastSeq = parseInt(lastIssue[0].issue_no.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
