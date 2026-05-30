import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningRow, RowStatus } from '../entities/planning-row.entity';

@Injectable()
export class PlanningRowRepository {
  constructor(
    @InjectRepository(PlanningRow)
    private readonly repository: Repository<PlanningRow>,
  ) {}

  async create(data: Partial<PlanningRow>): Promise<PlanningRow> {
    const row = this.repository.create(data);
    return await this.repository.save(row);
  }

  async bulkInsert(rows: Partial<PlanningRow>[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(PlanningRow)
      .values(rows)
      .orUpdate(
        ['quantity', 'status', 'error_message', 'updated_at'],
        ['batch_id', 'customer_code', 'product_code', 'sale_date']
      )
      .execute();
  }

  async findById(id: number): Promise<PlanningRow | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['batch', 'customer', 'product'],
    });
  }

  async findByBatchId(batchId: number): Promise<PlanningRow[]> {
    return await this.repository.find({
      where: { batchId },
      relations: ['customer', 'product'],
      order: { saleDate: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      customerCode?: string;
      productCode?: string;
      customerId?: number;
      productId?: number;
    },
  ): Promise<PlanningRow[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('row')
      .where('row.saleDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (options?.customerCode) {
      queryBuilder.andWhere('row.customerCode = :customerCode', {
        customerCode: options.customerCode,
      });
    }

    if (options?.productCode) {
      queryBuilder.andWhere('row.productCode = :productCode', {
        productCode: options.productCode,
      });
    }

    if (options?.customerId) {
      queryBuilder.andWhere('row.customerId = :customerId', {
        customerId: options.customerId,
      });
    }

    if (options?.productId) {
      queryBuilder.andWhere('row.productId = :productId', {
        productId: options.productId,
      });
    }

    queryBuilder
      .leftJoinAndSelect('row.customer', 'customer')
      .leftJoinAndSelect('row.product', 'product')
      .orderBy('row.saleDate', 'ASC')
      .addOrderBy('row.customerCode', 'ASC')
      .addOrderBy('row.productCode', 'ASC');

    return await queryBuilder.getMany();
  }

  async findByYearMonth(
    year: number,
    month: number,
    options?: {
      customerCode?: string;
      productCode?: string;
    },
  ): Promise<PlanningRow[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await this.findByDateRange(startDate, endDate, options);
  }

  async findByCustomer(customerCode: string): Promise<PlanningRow[]> {
    return await this.repository.find({
      where: { customerCode },
      relations: ['batch', 'customer', 'product'],
      order: { saleDate: 'DESC' },
    });
  }

  async findByProduct(productCode: string): Promise<PlanningRow[]> {
    return await this.repository.find({
      where: { productCode },
      relations: ['batch', 'customer', 'product'],
      order: { saleDate: 'DESC' },
    });
  }

  async findByStatus(status: RowStatus): Promise<PlanningRow[]> {
    return await this.repository.find({
      where: { status },
      relations: ['batch'],
    });
  }

  async update(id: number, data: Partial<PlanningRow>): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByBatchId(batchId: number): Promise<void> {
    await this.repository.delete({ batchId });
  }

  async countByBatchId(batchId: number): Promise<number> {
    return await this.repository.count({ where: { batchId } });
  }

  async countByStatus(status: RowStatus): Promise<number> {
    return await this.repository.count({ where: { status } });
  }

  async getSummaryByBatchId(batchId: number): Promise<{
    totalRows: number;
    totalQuantity: number;
    validRows: number;
    invalidRows: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('row')
      .select('COUNT(*)', 'totalRows')
      .addSelect('SUM(row.quantity)', 'totalQuantity')
      .addSelect(
        'SUM(CASE WHEN row.status = :valid THEN 1 ELSE 0 END)',
        'validRows'
      )
      .addSelect(
        'SUM(CASE WHEN row.status = :invalid THEN 1 ELSE 0 END)',
        'invalidRows'
      )
      .where('row.batchId = :batchId', { batchId })
      .setParameters({ valid: RowStatus.VALID, invalid: RowStatus.INVALID })
      .getRawOne();

    return {
      totalRows: parseInt(result.totalRows) || 0,
      totalQuantity: parseFloat(result.totalQuantity) || 0,
      validRows: parseInt(result.validRows) || 0,
      invalidRows: parseInt(result.invalidRows) || 0,
    };
  }
}
