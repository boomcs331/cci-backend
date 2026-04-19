import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { ResponseHelper } from '@app/common';
import {
  PermissionMatch,
  RequirePermissions,
} from '../auth/decorators/require-permissions.decorator';
import { ProductStockService } from './product-stock.service';
import { CreateProductSalesReservationDto } from './dto/product-sales-reservation.dto';

@Controller('products')
export class ProductInventoryController {
  constructor(private readonly productStockService: ProductStockService) {}

  @Get('stock/alerts')
  @RequirePermissions('products.stock.read')
  async getStockAlerts() {
    const data = await this.productStockService.getStockAlertSummary();
    return ResponseHelper.success(
      data,
      'Product stock alert summary retrieved successfully',
    );
  }

  @Get('stock')
  @RequirePermissions('products.stock.read')
  async getStockList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = parseInt(page ?? '1', 10) || 1;
    const l = parseInt(limit ?? '20', 10) || 20;
    const result = await this.productStockService.getStockListPaginated(
      p,
      l,
      search,
    );
    return ResponseHelper.paginated(
      result.data,
      result.page,
      result.limit,
      result.total,
      'Product stock retrieved successfully',
    );
  }

  @Get('sales-reservations')
  @PermissionMatch('any')
  @RequirePermissions('products.stock.read', 'products.sales.reserve')
  async getSalesReservations() {
    const data = await this.productStockService.getSalesReservationsGrouped();
    return ResponseHelper.success(
      data,
      'Sales reservations retrieved successfully',
    );
  }

  @Post('sales-reservations')
  @RequirePermissions('products.sales.reserve')
  async createSalesReservation(
    @Body() dto: CreateProductSalesReservationDto,
    @Request() req: { user?: { username?: string } },
  ) {
    const username = req.user?.username ?? 'system';
    const row = await this.productStockService.createSalesReservation(
      dto,
      username,
    );
    return ResponseHelper.success(row, 'จองสินค้าเพื่อขายสำเร็จ');
  }

  @Post('sales-reservations/:id/release')
  @RequirePermissions('products.sales.reserve')
  async release(@Param('id') id: string) {
    const row = await this.productStockService.releaseSalesReservation(id);
    return ResponseHelper.success(row, 'ยกเลิกการจองแล้ว — คืนจำนวนเข้าสต็อกพร้อมขาย');
  }

  @Post('sales-reservations/:id/fulfill')
  @RequirePermissions('products.sales.reserve')
  async fulfill(@Param('id') id: string) {
    const row = await this.productStockService.fulfillSalesReservation(id);
    return ResponseHelper.success(row, 'ตัดขายสำเร็จ — หักจากสต็อกรวมและจองแล้ว');
  }
}
