import { Controller, Get, Query } from '@nestjs/common';
import { SalesDashboardService } from './sales-dashboard.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('sales/dashboard')
export class SalesDashboardController {
  constructor(private readonly service: SalesDashboardService) {}

  @Get('summary')
  @RequirePermissions('sales_order.read')
  getSummary() {
    return this.service.getDashboardSummary();
  }

  @Get('kpi')
  @RequirePermissions('sales_order.read')
  getKPI() {
    return this.service.getKPI();
  }

  @Get('sales-chart')
  @RequirePermissions('sales_order.read')
  getSalesChart(@Query('days') days?: string) {
    return this.service.getSalesChart(days ? parseInt(days) : 30);
  }

  @Get('top-products')
  @RequirePermissions('sales_order.read')
  getTopProducts(@Query('limit') limit?: string) {
    return this.service.getTopProducts(limit ? parseInt(limit) : 5);
  }

  @Get('upcoming-deliveries')
  @RequirePermissions('sales_order.read')
  getUpcomingDeliveries(@Query('days') days?: string) {
    return this.service.getUpcomingDeliveries(days ? parseInt(days) : 7);
  }
}
