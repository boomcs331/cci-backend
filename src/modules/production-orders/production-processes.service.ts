import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionProcess } from './entities/production-process.entity';
import { ProductProductionStep } from '../products/entities/product-production-step.entity';
import {
  CreateProductionProcessDto,
  UpdateProductionProcessDto,
} from './dto/production-process.dto';

@Injectable()
export class ProductionProcessesService {
  constructor(
    @InjectRepository(ProductionProcess)
    private readonly processRepo: Repository<ProductionProcess>,
    @InjectRepository(ProductProductionStep)
    private readonly productStepRepo: Repository<ProductProductionStep>,
  ) {}

  private normalizeProcessCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private normalizeDeptCodes(codes?: string[] | null): string[] | null {
    if (codes == null) return null;
    const cleaned = codes
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    return cleaned.length ? [...new Set(cleaned)] : null;
  }

  private mapConflict(error: unknown): never {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      throw new ConflictException('รหัสกระบวนการ (process_code) ซ้ำในระบบ');
    }
    throw error;
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    isActive?: boolean,
  ): Promise<{
    data: ProductionProcess[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.processRepo
      .createQueryBuilder('p')
      .orderBy('p.sequenceOrder', 'ASC')
      .addOrderBy('p.id', 'ASC');

    if (isActive !== undefined) {
      qb.andWhere('p.isActive = :isActive', { isActive });
    }

    const q = search?.trim();
    if (q) {
      qb.andWhere(
        '(p.processCode ILIKE :q OR p.processName ILIKE :q)',
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

  async findOne(id: number): Promise<ProductionProcess> {
    const row = await this.processRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Production process id ${id} not found`);
    }
    return row;
  }

  async create(dto: CreateProductionProcessDto): Promise<ProductionProcess> {
    try {
      const saved = await this.processRepo.save(
        this.processRepo.create({
          processCode: this.normalizeProcessCode(dto.processCode),
          processName: dto.processName.trim(),
          sequenceOrder: dto.sequenceOrder,
          isActive: dto.isActive ?? true,
          allowedDepartmentCodes: this.normalizeDeptCodes(
            dto.allowedDepartmentCodes,
          ),
        }),
      );
      return this.findOne(saved.id);
    } catch (error) {
      this.mapConflict(error);
    }
  }

  async update(
    id: number,
    dto: UpdateProductionProcessDto,
  ): Promise<ProductionProcess> {
    const row = await this.findOne(id);
    try {
      await this.processRepo.save({
        ...row,
        processCode:
          dto.processCode !== undefined
            ? this.normalizeProcessCode(dto.processCode)
            : row.processCode,
        processName:
          dto.processName !== undefined ? dto.processName.trim() : row.processName,
        sequenceOrder: dto.sequenceOrder ?? row.sequenceOrder,
        isActive: dto.isActive ?? row.isActive,
        allowedDepartmentCodes:
          dto.allowedDepartmentCodes !== undefined
            ? this.normalizeDeptCodes(dto.allowedDepartmentCodes)
            : row.allowedDepartmentCodes,
      });
      return this.findOne(id);
    } catch (error) {
      this.mapConflict(error);
    }
  }

  async remove(id: number): Promise<{ message: string; deactivated?: boolean }> {
    const row = await this.findOne(id);
    const inUse = await this.productStepRepo.count({
      where: { processId: id },
    });
    if (inUse > 0) {
      if (!row.isActive) {
        throw new BadRequestException(
          `กระบวนการนี้ถูกใช้ในขั้นตอนสินค้า ${inUse} รายการ — ปิดใช้งานแล้ว ไม่สามารถลบได้`,
        );
      }
      row.isActive = false;
      await this.processRepo.save(row);
      return {
        message:
          'กระบวนการถูกใช้งานอยู่ — ปิดใช้งาน (is_active=false) แทนการลบ',
        deactivated: true,
      };
    }

    try {
      await this.processRepo.remove(row);
      return { message: 'Production process deleted successfully' };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === '23503'
      ) {
        row.isActive = false;
        await this.processRepo.save(row);
        return {
          message:
            'กระบวนการถูกอ้างอิงในระบบ — ปิดใช้งานแทนการลบ',
          deactivated: true,
        };
      }
      throw error;
    }
  }
}
