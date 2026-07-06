import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlanningRowRepository } from '../repositories/planning-row.repository';
import { PlanningBatchRepository } from '../repositories/planning-batch.repository';
import { PlanningQueryDto } from '../dto/planning-query.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('sales-planning')
// @UseGuards(JwtAuthGuard)
export class PlanningDataController {
  constructor(
    private readonly rowRepository: PlanningRowRepository,
    private readonly batchRepository: PlanningBatchRepository,
  ) {}

  @Get('row/:id')
  async getPlanningRow(@Param('id') id: string) {
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      throw new Error('Invalid planning row id');
    }
    const row = await this.rowRepository.findById(idNum);
    if (!row) {
      throw new Error('Planning row not found');
    }
    return row;
  }

  @Get()
  async getPlanningData(@Query() query: PlanningQueryDto) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.year && query.month) {
      startDate = new Date(query.year, query.month - 1, 1);
      endDate = new Date(query.year, query.month, 0);
    } else if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    }

    const rows = await this.rowRepository.findByDateRange(
      startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      {
        customerCode: query.customerCode,
        productCode: query.productCode,
      },
    );

    return {
      rows,
      total: rows.length,
      filters: query,
    };
  }

  @Delete('batch/:batchId')
  async deletePlanningData(@Param('batchId') batchId: string, @Request() req) {
    const batchIdNum = parseInt(batchId);
    if (isNaN(batchIdNum)) {
      throw new Error('Invalid batch id');
    }
    const userId = req.user?.id || 1;
    await this.batchRepository.delete(batchIdNum);
    return { message: 'Planning data deleted successfully' };
  }
}
