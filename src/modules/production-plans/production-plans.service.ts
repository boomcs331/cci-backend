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

    Object.assign(plan, dto);
    plan.updateBy = username;
    
    if (dto.planDate) {
      plan.planDate = new Date(dto.planDate);
    }

    return this.planRepo.save(plan);
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
      await this.reservationRepo.delete({ planId });

      const materialRequirements = new Map<number, number>();

      for (const item of plan.items) {
        const boms = await this.bomRepo.find({
          where: { productId: item.productId, isActive: true },
        });

        for (const bom of boms) {
          const required = Number(bom.quantityPerUnit) * Number(item.quantity);
          const current = materialRequirements.get(bom.materialId) || 0;
          materialRequirements.set(bom.materialId, current + required);
        }
      }

      for (const [materialId, requiredQty] of materialRequirements) {
        const stock = await queryRunner.manager.findOne(MaterialsStock, {
          where: { materialId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!stock || stock.availableQty < requiredQty) {
          throw new BadRequestException(
            `Material ID ${materialId} มีจำนวนไม่เพียงพอ (ต้องการ: ${requiredQty}, มีอยู่: ${stock?.availableQty || 0})`
          );
        }

        await queryRunner.manager.query(
          `INSERT INTO material_reservations (plan_id, material_id, reserved_quantity, create_date) VALUES ($1, $2, $3, NOW())`,
          [planId, materialId, requiredQty]
        );

        stock.availableQty -= requiredQty;
        stock.reservedQty += requiredQty;
        await queryRunner.manager.save(stock);
      }

      plan.status = PlanStatus.RESERVED;
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

  async confirm(planId: number, username: string) {
    const plan = await this.findOne(planId);
    
    if (plan.status !== PlanStatus.RESERVED) {
      throw new BadRequestException('สามารถยืนยันได้เฉพาะแผนที่จอง material แล้ว');
    }

    plan.status = PlanStatus.CONFIRMED;
    plan.updateBy = username;
    
    return this.planRepo.save(plan);
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
          availableQty: stock?.availableQty || 0,
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

    return {
      planId: plan.id,
      planCode: plan.planCode,
      planName: plan.planName,
      planDate: plan.planDate,
      status: plan.status,
      items: details
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
}
