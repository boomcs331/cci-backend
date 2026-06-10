import { Controller, Get, Query } from '@nestjs/common';
import { SalesReportsService } from '../services/sales-reports.service';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('sales/reports')
export class SalesReportsController {
  constructor(private readonly service: SalesReportsService) {}

  @Get('summary')
  @RequirePermissions('sales_order.read')
  getSummary(@Query('year') year?: string) {
    return this.service.getReportsSummary(year ? parseInt(year) : undefined);
  }

  @Get('by-customer')
  @RequirePermissions('sales_order.read')
  getSalesByCustomer(@Query('year') year?: string) {
    return this.service.getSalesByCustomer(year ? parseInt(year) : undefined);
  }

  @Get('by-product')
  @RequirePermissions('sales_order.read')
  getSalesByProduct(@Query('year') year?: string) {
    return this.service.getSalesByProduct(year ? parseInt(year) : undefined);
  }

  @Get('monthly')
  @RequirePermissions('sales_order.read')
  getMonthlySales(@Query('year') year?: string) {
    return this.service.getMonthlySales(year ? parseInt(year) : undefined);
  }
}
