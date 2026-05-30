import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SalesImportService } from './sales-import.service';
import { ImportCommitDto } from './dto/import-commit.dto';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthUserService } from '../auth/services/auth-user.service';

@Controller('sales/import')
export class SalesImportController {
  constructor(
    private readonly service: SalesImportService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Get('template')
  @RequirePermissions('sales_order.import')
  downloadTemplate(@Res() res: Response) {
    const buffer = this.service.getTemplateBuffer();
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-import-template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Post('upload')
  @RequirePermissions('sales_order.import')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('ไม่พบไฟล์');
    }

    const userId = this.resolveUserId(req);
    const rows = await this.service.parseExcel(file);
    const batch = await this.service.validateAndSave(
      rows,
      file.originalname,
      userId,
    );

    return {
      success: true,
      data: batch,
      message: 'อัปโหลดและตรวจสอบสำเร็จ',
    };
  }

  @Get('batches')
  @RequirePermissions('sales_order.import')
  listBatches(@Query() query: { page?: number; pageSize?: number; status?: string }) {
    return this.service.listBatches(query);
  }

  @Get('batches/:id')
  @RequirePermissions('sales_order.import')
  getBatch(@Param('id') id: string) {
    return this.service.getBatch(id);
  }

  @Post('commit')
  @RequirePermissions('sales_order.import')
  async commit(@Body() dto: ImportCommitDto, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.commitBatch(dto.batchId, username);
  }

  private resolveUserId(req: {
    user?: { id?: string | number };
    headers?: Record<string, string | string[] | undefined>;
  }): number {
    if (req.user?.id != null) return Number(req.user.id);
    const raw = req.headers?.['x-user-id'];
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id?.trim()) return 0;
    return Number(id.trim());
  }
}
