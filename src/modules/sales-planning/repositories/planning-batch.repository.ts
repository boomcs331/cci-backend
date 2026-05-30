import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningBatch, BatchStatus } from '../entities/planning-batch.entity';

@Injectable()
export class PlanningBatchRepository {
  constructor(
    @InjectRepository(PlanningBatch)
    private readonly repository: Repository<PlanningBatch>,
  ) {}

  async create(data: Partial<PlanningBatch>): Promise<PlanningBatch> {
    const batch = this.repository.create(data);
    return await this.repository.save(batch);
  }

  async findById(id: number): Promise<PlanningBatch | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['rows', 'errors'],
    });
  }

  async findByBatchCode(batchCode: string): Promise<PlanningBatch | null> {
    return await this.repository.findOne({
      where: { batchCode },
    });
  }

  async findByYearMonth(year: number, month: number): Promise<PlanningBatch | null> {
    return await this.repository.findOne({
      where: { year, month },
    });
  }

  async updateStatus(
    id: number,
    status: BatchStatus,
    metadata?: {
      totalRows?: number;
      successRows?: number;
      errorRows?: number;
      processedAt?: Date;
      processingDurationMs?: number;
      errorSummary?: Record<string, any>;
    },
  ): Promise<void> {
    await this.repository.update(id, {
      status,
      ...metadata,
    });
  }

  async update(id: number, data: Partial<PlanningBatch>): Promise<void> {
    await this.repository.update(id, data);
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    status?: BatchStatus;
    year?: number;
    month?: number;
  }): Promise<[PlanningBatch[], number]> {
    const queryBuilder = this.repository.createQueryBuilder('batch');

    if (options?.status) {
      queryBuilder.andWhere('batch.status = :status', { status: options.status });
    }

    if (options?.year) {
      queryBuilder.andWhere('batch.year = :year', { year: options.year });
    }

    if (options?.month) {
      queryBuilder.andWhere('batch.month = :month', { month: options.month });
    }

    queryBuilder.orderBy('batch.uploadedAt', 'DESC');

    if (options?.skip) {
      queryBuilder.skip(options.skip);
    }

    if (options?.take) {
      queryBuilder.take(options.take);
    }

    return await queryBuilder.getManyAndCount();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async countByStatus(status: BatchStatus): Promise<number> {
    return await this.repository.count({ where: { status } });
  }
}
