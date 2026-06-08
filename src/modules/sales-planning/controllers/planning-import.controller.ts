import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
// import { v4 as uuidv4 } from 'uuid';
import { PlanningImportService, ImportResult } from '../services/planning-import.service';
import { PlanningBatchRepository } from '../repositories/planning-batch.repository';
import { PlanningErrorRepository } from '../repositories/planning-error.repository';
import { PlanningRowRepository } from '../repositories/planning-row.repository';
import { ImportPlanningDto } from '../dto/import-planning.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('sales-planning/import')
// @UseGuards(JwtAuthGuard)
export class PlanningImportController {
  constructor(
    private readonly importService: PlanningImportService,
    private readonly batchRepository: PlanningBatchRepository,
    private readonly errorRepository: PlanningErrorRepository,
    private readonly rowRepository: PlanningRowRepository,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = './uploads/planning';
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Please upload Excel file'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async importPlanning(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportPlanningDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const userId = req.user?.id || 1; // Default to 1 if no user
    return await this.importService.importPlanning({
      file,
      year: dto.year,
      month: dto.month,
      userId,
    });
  }

  @Get(':batchId/status')
  async getBatchStatus(@Param('batchId') batchId: string) {
    const batch = await this.batchRepository.findById(parseInt(batchId));
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }
    return {
      batchId: batch.id,
      batchCode: batch.batchCode,
      status: batch.status,
      totalRows: batch.totalRows,
      successRows: batch.successRows,
      errorRows: batch.errorRows,
      skippedRows: batch.skippedRows,
      uploadedAt: batch.uploadedAt,
      processedAt: batch.processedAt,
      processingDurationMs: batch.processingDurationMs,
      errorSummary: batch.errorSummary,
    };
  }

  @Get(':batchId/errors')
  async getBatchErrors(
    @Param('batchId') batchId: string,
    @Query() query?: { skip?: number; take?: number; errorType?: string; errorCode?: string; rowNumber?: number; fieldName?: string },
  ) {
    const batchIdNum = parseInt(batchId);
    const skip = !isNaN(query?.skip || 0) ? (query?.skip || 0) : 0;
    const take = !isNaN(query?.take || 50) ? (query?.take || 50) : 50;

    const [errors, total] = await this.errorRepository.findByBatchId(batchIdNum, {
      skip,
      take,
      errorType: query?.errorType,
      errorCode: query?.errorCode,
      rowNumber: query?.rowNumber,
      fieldName: query?.fieldName,
    });

    return {
      data: {
        errors,
        total,
        skip,
        take: Number(take),
      },
    };
  }

  @Get(':batchId/rows')
  async getBatchRows(
    @Param('batchId') batchId: string,
    @Query() query?: { skip?: number; take?: number; customerCode?: string; productCode?: string; status?: string },
  ) {
    const batchIdNum = parseInt(batchId);
    const skip = !isNaN(query?.skip || 0) ? (query?.skip || 0) : 0;
    const take = !isNaN(query?.take || 20) ? (query?.take || 20) : 20;

    let rows = await this.rowRepository.findByBatchId(batchIdNum);

    // Apply filters
    if (query?.customerCode) {
      rows = rows.filter(r => r.customerCode === query.customerCode);
    }
    if (query?.productCode) {
      rows = rows.filter(r => r.productCode === query.productCode);
    }
    if (query?.status) {
      rows = rows.filter(r => r.status === query.status);
    }

    const total = rows.length;
    const paginatedRows = rows.slice(skip, skip + take);

    return {
      data: {
        rows: paginatedRows,
        total,
        skip,
        take,
      },
    };
  }

  @Get(':batchId/detail')
  async getBatchDetail(@Param('batchId') batchId: string) {
    const batchIdNum = parseInt(batchId);
    const batch = await this.batchRepository.findById(batchIdNum);
    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    const rows = await this.rowRepository.findByBatchId(batchIdNum);
    const errors = await this.errorRepository.findByBatchId(batchIdNum);

    return {
      data: {
        batch,
        rows,
        errors,
      },
    };
  }

  @Post(':batchId/cancel')
  async cancelImport(@Param('batchId') batchId: string) {
    await this.importService.cancelImport(parseInt(batchId));
    return { message: 'Import cancelled successfully' };
  }

  @Post('history')
  async getImportHistory(
    @Body() body?: { skip?: number; take?: number; status?: string; year?: number; month?: number },
  ) {
    const skip = !isNaN(body?.skip || 0) ? (body?.skip || 0) : 0;
    const take = !isNaN(body?.take || 20) ? (body?.take || 20) : 20;

    const [batches, total] = await this.batchRepository.findAll({
      skip,
      take,
      status: body?.status as any,
      year: body?.year,
      month: body?.month,
    });

    return {
      data: {
        batches,
        total,
        skip,
        take,
      },
    };
  }
}
