import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionOrder, ProductionMaterialRequirement } from './entities';
import { CreateProductionOrderDto, UpdateProductionOrderDto, IssueMaterialsDto } from './dto/production.dto';
import { ProductsService } from '../products/products.service';
import { MaterialIssuing } from '../materials/receiving-issuing/entities/material-issuing.entity';
import { MaterialIssuingLot } from '../materials/receiving-issuing/entities/material-issuing-lot.entity';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder)
    private orderRepo: Repository<ProductionOrder>,
    @InjectRepository(ProductionMaterialRequirement)
    private requirementRepo: Repository<ProductionMaterialRequirement>,
    @InjectRepository(MaterialIssuing)
    private issuingRepo: Repository<MaterialIssuing>,
    @InjectRepository(MaterialIssuingLot)
    private issuingLotRepo: Repository<MaterialIssuingLot>,
    @InjectRepository(MaterialsStock)
    private stockRepo: Repository<MaterialsStock>,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  async findAllWithoutPagination() {
    return this.orderRepo.find({
      relations: ['product'],
      order: { createDate: 'DESC' },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'id',
    sortOrder: string = 'DESC',
    status?: string
  ): Promise<{
    orders: ProductionOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product');

    if (status) {
      queryBuilder.where('order.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(order.orderNo ILIKE :search OR product.productCode ILIKE :search OR product.productName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortColumns = ['id', 'orderNo', 'quantity', 'status', 'plannedDate', 'createDate'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder.orderBy(`order.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const orders = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['product', 'materialRequirements', 'materialRequirements.material', 'materialRequirements.material.materialsType'],
    });
    if (!order) throw new NotFoundException('Production order not found');
    return order;
  }

  async findByOrderNo(orderNo: string) {
    const order = await this.orderRepo.findOne({
      where: { orderNo },
      relations: ['product', 'materialRequirements', 'materialRequirements.material', 'materialRequirements.material.materialsType'],
    });
    if (!order) throw new NotFoundException('Production order not found');
    return order;
  }

  async create(dto: CreateProductionOrderDto, user: string) {
    const product = await this.productsService.findByCode(dto.productCode);
    
    const orderNo = await this.generateOrderNo();
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = this.orderRepo.create({
        orderNo,
        productId: product.id,
        quantity: dto.quantity,
        plannedDate: dto.plannedDate,
        notes: dto.notes,
        status: 'PENDING',
        createBy: user,
        updateBy: user,
      });
      const savedOrder = await queryRunner.manager.save(order);

      const requirements = product.boms.map(bom => {
        const required = Number(bom.quantityPerUnit) * dto.quantity;
        return this.requirementRepo.create({
          productionOrderId: savedOrder.id,
          materialId: bom.materialId,
          requiredQuantity: required,
          issuedQuantity: 0,
          unit: bom.unit,
          status: 'PENDING',
        });
      });
      await queryRunner.manager.save(requirements);

      await queryRunner.commitTransaction();
      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateProductionOrderDto, user: string) {
    const order = await this.findOne(id);
    Object.assign(order, dto, { updateBy: user });
    await this.orderRepo.save(order);
    return this.findOne(id);
  }

  async getRequirements(orderId: number) {
    const order = await this.findOne(orderId);
    return order.materialRequirements;
  }

  async getRequirementsByType(orderId: number, materialType: string) {
    const order = await this.findOne(orderId);
    return order.materialRequirements.filter(
      req => req.material.materialsType.code === materialType,
    );
  }

  async issueMaterials(orderId: number, dto: IssueMaterialsDto, user: string) {
    const order = await this.findOne(orderId);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const issuings: MaterialIssuing[] = [];

      for (const item of dto.items) {
        const requirement = order.materialRequirements.find(r => r.materialId === item.materialId);
        if (!requirement) throw new BadRequestException(`Material ${item.materialId} not in requirements`);

        const stock = await queryRunner.manager.findOne(MaterialsStock, { where: { materialId: item.materialId } });
        if (!stock || stock.availableQty < item.quantity) {
          throw new BadRequestException(`Insufficient stock for material ${item.materialId}`);
        }

        const issuingNo = await this.generateIssuingNo();
        const issuing = this.issuingRepo.create({
          issuingNo,
          issuingDate: new Date(),
          issuingType: 'PRODUCTION_ORDER',
          materialId: item.materialId,
          totalQuantity: item.quantity,
          unit: requirement.unit,
          productionOrderId: order.id,
          requiredQuantity: requirement.requiredQuantity,
          workOrderNo: order.orderNo,
          partNo: order.product.productCode,
          requester: dto.requester || user,
          remark: dto.remark,
          status: 'COMPLETED',
          createBy: user,
          updateBy: user,
        });
        const savedIssuing = await queryRunner.manager.save(issuing);

        if (item.lots?.length) {
          for (const lot of item.lots) {
            const issuingLot = this.issuingLotRepo.create({
              issuingId: savedIssuing.id,
              qrCode: lot.qrCode,
              quantity: lot.quantity,
              unit: requirement.unit,
            });
            await queryRunner.manager.save(issuingLot);
          }
        }

        requirement.issuedQuantity = Number(requirement.issuedQuantity) + item.quantity;
        requirement.status = requirement.issuedQuantity >= requirement.requiredQuantity ? 'COMPLETED' : 'PARTIAL';
        await queryRunner.manager.save(requirement);

        stock.availableQty -= item.quantity;
        stock.totalQty -= item.quantity;
        await queryRunner.manager.save(stock);

        issuings.push(savedIssuing);
      }

      await queryRunner.commitTransaction();
      return { success: true, issuings };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.orderRepo.count();
    return `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateIssuingNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.issuingRepo.count();
    return `ISS-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
}
