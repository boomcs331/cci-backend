import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningError, ErrorSeverity } from '../entities/planning-error.entity';

@Injectable()
export class PlanningErrorRepository {
  constructor(
    @InjectRepository(PlanningError)
    private readonly repository: Repository<PlanningError>,
  ) {}

  async create(data: Partial<PlanningError>): Promise<PlanningError> {
    const error = this.repository.create(data);
    return await this.repository.save(error);
  }

  async bulkInsert(errors: Partial<PlanningError>[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(PlanningError)
      .values(errors)
      .execute();
  }

  async findById(id: number): Promise<PlanningError | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['batch'],
    });
  }

  async findByBatchId(
    batchId: number,
    options?: {
      skip?: number;
      take?: number;
      errorType?: string;
      errorCode?: string;
      severity?: ErrorSeverity;
      rowNumber?: number;
      fieldName?: string;
    },
  ): Promise<[PlanningError[], number]> {
    const queryBuilder = this.repository
      .createQueryBuilder('error')
      .where('error.batchId = :batchId', { batchId });

    if (options?.errorType) {
      queryBuilder.andWhere('error.errorType = :errorType', {
        errorType: options.errorType,
      });
    }

    if (options?.errorCode) {
      queryBuilder.andWhere('error.errorCode = :errorCode', {
        errorCode: options.errorCode,
      });
    }

    if (options?.severity) {
      queryBuilder.andWhere('error.severity = :severity', {
        severity: options.severity,
      });
    }

    if (options?.rowNumber) {
      queryBuilder.andWhere('error.rowNumber = :rowNumber', {
        rowNumber: options.rowNumber,
      });
    }

    if (options?.fieldName) {
      queryBuilder.andWhere('error.fieldName = :fieldName', {
        fieldName: options.fieldName,
      });
    }

    queryBuilder.orderBy('error.rowNumber', 'ASC');

    if (options?.skip) {
      queryBuilder.skip(options.skip);
    }

    if (options?.take) {
      queryBuilder.take(options.take);
    }

    return await queryBuilder.getManyAndCount();
  }

  async findByRowNumber(batchId: number, rowNumber: number): Promise<PlanningError[]> {
    return await this.repository.find({
      where: { batchId, rowNumber },
      order: { createdAt: 'ASC' },
    });
  }

  async findByErrorCode(errorCode: string): Promise<PlanningError[]> {
    return await this.repository.find({
      where: { errorCode },
      relations: ['batch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeverity(severity: ErrorSeverity): Promise<PlanningError[]> {
    return await this.repository.find({
      where: { severity },
      relations: ['batch'],
      order: { createdAt: 'DESC' },
    });
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

  async countBySeverity(batchId: number, severity: ErrorSeverity): Promise<number> {
    return await this.repository.count({
      where: { batchId, severity },
    });
  }

  async getErrorSummary(batchId: number): Promise<{
    totalErrors: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    byErrorCode: Record<string, number>;
    byErrorType: Record<string, number>;
  }> {
    const errors = await this.repository.find({
      where: { batchId },
    });

    const summary = {
      totalErrors: errors.length,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      byErrorCode: {} as Record<string, number>,
      byErrorType: {} as Record<string, number>,
    };

    for (const error of errors) {
      if (error.severity === ErrorSeverity.ERROR) summary.errorCount++;
      if (error.severity === ErrorSeverity.WARNING) summary.warningCount++;
      if (error.severity === ErrorSeverity.INFO) summary.infoCount++;

      summary.byErrorCode[error.errorCode] =
        (summary.byErrorCode[error.errorCode] || 0) + 1;
      summary.byErrorType[error.errorType] =
        (summary.byErrorType[error.errorType] || 0) + 1;
    }

    return summary;
  }
}
