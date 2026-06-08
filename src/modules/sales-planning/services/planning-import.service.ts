import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PlanningBatchRepository } from '../repositories/planning-batch.repository';
import { PlanningRowRepository } from '../repositories/planning-row.repository';
import { PlanningErrorRepository } from '../repositories/planning-error.repository';
import { PlanningValidationService } from './planning-validation.service';
import { PlanningTransformService } from './planning-transform.service';
// import { PlanningQueueService } from './planning-queue.service';
import { BatchStatus } from '../entities/planning-batch.entity';
import { ErrorSeverity } from '../entities/planning-error.entity';
import { RowStatus } from '../entities/planning-row.entity';
import { ErrorCode } from '../constants/error-codes.enum';
import * as xlsx from 'xlsx';
import * as crypto from 'crypto';

export interface ImportOptions {
  file: Express.Multer.File;
  year: number;
  month: number;
  userId: number;
}

export interface ImportResult {
  batchId: number;
  batchCode: string;
  status: BatchStatus;
  message: string;
}

@Injectable()
export class PlanningImportService {
  constructor(
    private readonly batchRepository: PlanningBatchRepository,
    private readonly rowRepository: PlanningRowRepository,
    private readonly errorRepository: PlanningErrorRepository,
    private readonly validationService: PlanningValidationService,
    private readonly transformService: PlanningTransformService,
    // private readonly queueService: PlanningQueueService,
  ) {}

  async importPlanning(options: ImportOptions): Promise<ImportResult> {
    const { file, year, month, userId } = options;

    // Validate year/month
    const yearError = this.validationService.validateYear(year);
    if (yearError) {
      throw new BadRequestException(yearError.message);
    }

    const monthError = this.validationService.validateMonth(month);
    if (monthError) {
      throw new BadRequestException(monthError.message);
    }

    // Validate file size
    const sizeError = this.validationService.validateFileSize(file.size);
    if (sizeError) {
      throw new BadRequestException(sizeError.message);
    }

    // Validate file type
    const typeError = this.validationService.validateFileType(file.mimetype);
    if (typeError) {
      throw new BadRequestException(typeError.message);
    }

    // Check if batch already exists for this month
    const existingBatch = await this.batchRepository.findByYearMonth(year, month);
    if (existingBatch && existingBatch.status !== BatchStatus.CANCELLED) {
      throw new ConflictException('Planning data already exists for this month');
    }

    // Generate batch code
    const batchCode = this.generateBatchCode(year, month);

    // Calculate file hash
    const fileHash = this.calculateFileHash(file.path);

    // Create batch record
    const batch = await this.batchRepository.create({
      batchCode,
      year,
      month,
      status: BatchStatus.PENDING,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileHash,
      uploadedBy: userId,
      uploadedAt: new Date(),
    });

    // Process the batch synchronously (queue service disabled)
    await this.processPlanningBatch({
      batchId: batch.id,
      filePath: file.path,
      year,
      month,
    });

    return {
      batchId: batch.id,
      batchCode: batch.batchCode,
      status: batch.status,
      message: 'File uploaded and processed successfully.',
    };
  }

  async processPlanningBatch(jobData: {
    batchId: number;
    filePath: string;
    year: number;
    month: number;
  }): Promise<void> {
    const { batchId, filePath, year, month } = jobData;
    const startTime = Date.now();

    try {
      // Update status to PROCESSING
      await this.batchRepository.updateStatus(batchId, BatchStatus.PROCESSING);

      // Parse Excel file
      const rows = await this.parseExcelFile(filePath);

      // Validate batch
      const validationResult = await this.validationService.validateBatch(
        rows,
        year,
        month,
      );

      // Transform valid rows
      const transformResult = await this.transformService.transformBatch(
        validationResult.validRowsData,
        batchId,
        year,
        month,
      );

      // Save transformed rows
      if (transformResult.transformedRows.length > 0) {
        const rowsToInsert = transformResult.transformedRows.map((row) => ({
          ...row,
          customerId: row.customerId ?? undefined,
          productId: row.productId ?? undefined,
          model: row.model ?? undefined,
          gate: row.gate ?? undefined,
          location: row.location ?? undefined,
          round: row.round ?? undefined,
          line: row.line ?? undefined,
          status: RowStatus.VALID,
        }));

        // Deduplicate rows based on unique constraint (batch_id, customer_code, product_code, sale_date, round)
        const uniqueRowsMap = new Map<string, any>();
        for (const row of rowsToInsert) {
          const key = `${row.batchId}-${row.customerCode}-${row.productCode}-${row.saleDate}-${row.round}`;
          if (!uniqueRowsMap.has(key)) {
            uniqueRowsMap.set(key, row);
          }
        }
        const deduplicatedRows = Array.from(uniqueRowsMap.values());

        await this.rowRepository.bulkInsert(deduplicatedRows);
      }

      // Save errors
      if (validationResult.errors.length > 0) {
        const errorRecords = validationResult.errors.map((error) => ({
          batchId,
          rowNumber: error.rowNumber,
          errorType: error.field,
          errorCode: error.code,
          errorMessage: error.message,
          fieldName: error.field,
          fieldValue: String(error.value),
          severity: error.severity as ErrorSeverity,
          errorDetails: error.details,
        }));
        await this.errorRepository.bulkInsert(errorRecords);
      }

      // Calculate final status
      const processingDurationMs = Date.now() - startTime;
      const status =
        validationResult.errors.length > 0
          ? BatchStatus.PARTIAL
          : BatchStatus.COMPLETED;

      // Update batch status
      await this.batchRepository.updateStatus(batchId, status, {
        totalRows: rows.length,
        successRows: transformResult.transformedRows.length,
        errorRows: validationResult.errors.length,
        processedAt: new Date(),
        processingDurationMs,
        errorSummary: {
          validationErrors: validationResult.errors.filter(
            (e) => e.severity === 'ERROR',
          ).length,
          businessRuleErrors: validationResult.errors.filter(
            (e) => e.severity === 'WARNING',
          ).length,
          byErrorCode: this.groupErrorsByCode(validationResult.errors),
          skippedRows: transformResult.skippedRows,
        },
      });

      // Clear transform cache
      this.transformService.clearCache();

    } catch (error) {
      // Update batch status to FAILED
      await this.batchRepository.updateStatus(batchId, BatchStatus.FAILED, {
        processedAt: new Date(),
        processingDurationMs: Date.now() - startTime,
        errorSummary: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  private async parseExcelFile(filePath: string): Promise<any[]> {
    const path = require('path');
    const fs = require('fs');
    const absolutePath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(absolutePath);

    // Parse from buffer instead of file path
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Parse with raw values to preserve numbers
    const rawData = xlsx.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
    });

    return rawData;
  }

  private generateBatchCode(year: number, month: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `PLAN-${year}-${String(month).padStart(2, '0')}-${timestamp}`;
  }

  private calculateFileHash(filePath: string): string {
    const hash = crypto.createHash('md5');
    // For now, return a placeholder since we might not have the file content
    // In production, you'd read the file and calculate the hash
    return hash.update(Date.now().toString()).digest('hex');
  }

  private groupErrorsByCode(errors: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const error of errors) {
      grouped[error.code] = (grouped[error.code] || 0) + 1;
    }
    return grouped;
  }

  async cancelImport(batchId: number): Promise<void> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    if (
      batch.status === BatchStatus.COMPLETED ||
      batch.status === BatchStatus.FAILED
    ) {
      throw new BadRequestException(
        'Cannot cancel a completed or failed batch',
      );
    }

    await this.batchRepository.updateStatus(batchId, BatchStatus.CANCELLED);
  }

  async deletePlanningData(batchId: number): Promise<void> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    // Delete will cascade to rows, errors, and history
    await this.batchRepository.delete(batchId);
  }
}
