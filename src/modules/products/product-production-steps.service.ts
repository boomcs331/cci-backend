import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductProductionStep } from './entities/product-production-step.entity';
import { ProductBom } from './entities/product-bom.entity';
import { ProductionProcess } from '../production-orders/entities/production-process.entity';
import {
  CreateProductProductionStepDto,
  UpdateProductProductionStepDto,
} from './dto/product-production-step.dto';
import { ProductsService } from './products.service';

@Injectable()
export class ProductProductionStepsService {
  constructor(
    @InjectRepository(ProductProductionStep)
    private readonly stepRepo: Repository<ProductProductionStep>,
    @InjectRepository(ProductBom)
    private readonly bomRepo: Repository<ProductBom>,
    @InjectRepository(ProductionProcess)
    private readonly processRepo: Repository<ProductionProcess>,
    private readonly productsService: ProductsService,
  ) {}

  private async assertProductHasBom(productId: number) {
    const bomCount = await this.bomRepo.count({ where: { productId } });
    if (bomCount === 0) {
      throw new BadRequestException(
        'กรุณากำหนด BOM สำหรับสินค้านี้ก่อนตั้งลำดับกระบวนการผลิต',
      );
    }
  }

  private async assertProcessExists(processId: number) {
    const process = await this.processRepo.findOne({ where: { id: processId } });
    if (!process) {
      throw new NotFoundException(`Production process id ${processId} not found`);
    }
    return process;
  }

  private mapConflict(error: unknown): never {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      throw new ConflictException(
        'ลำดับขั้นตอนนี้มีอยู่แล้วสำหรับสินค้านี้ (product_id + step_order ต้องไม่ซ้ำ)',
      );
    }
    throw error;
  }

  async findAll(
    page = 1,
    limit = 10,
    productId?: number,
    search?: string,
  ): Promise<{
    data: ProductProductionStep[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.stepRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.product', 'product')
      .leftJoinAndSelect('s.process', 'process')
      .orderBy('s.productId', 'ASC')
      .addOrderBy('s.stepOrder', 'ASC');

    if (productId) {
      qb.andWhere('s.productId = :productId', { productId });
    }

    const q = search?.trim();
    if (q) {
      qb.andWhere(
        '(product.productCode ILIKE :q OR product.productName ILIKE :q OR process.processCode ILIKE :q OR process.processName ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<ProductProductionStep> {
    const row = await this.stepRepo.findOne({
      where: { id },
      relations: ['product', 'process'],
    });
    if (!row) {
      throw new NotFoundException(`Product production step id ${id} not found`);
    }
    return row;
  }

  async create(
    dto: CreateProductProductionStepDto,
    user: string,
  ): Promise<ProductProductionStep> {
    await this.productsService.findOne(dto.productId);
    await this.assertProductHasBom(dto.productId);
    await this.assertProcessExists(dto.processId);

    try {
      const saved = await this.stepRepo.save(
        this.stepRepo.create({
          productId: dto.productId,
          stepOrder: dto.stepOrder,
          processId: dto.processId,
          createBy: user,
          updateBy: user,
        }),
      );
      return this.findOne(saved.id);
    } catch (error) {
      this.mapConflict(error);
    }
  }

  async update(
    id: number,
    dto: UpdateProductProductionStepDto,
    user: string,
  ): Promise<ProductProductionStep> {
    const row = await this.findOne(id);
    if (dto.processId !== undefined) {
      await this.assertProcessExists(dto.processId);
    }

    try {
      await this.stepRepo.save({
        ...row,
        stepOrder: dto.stepOrder ?? row.stepOrder,
        processId: dto.processId ?? row.processId,
        updateBy: user,
      });
      return this.findOne(id);
    } catch (error) {
      this.mapConflict(error);
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const row = await this.findOne(id);
    await this.stepRepo.remove(row);
    return { message: 'Product production step deleted successfully' };
  }
}
