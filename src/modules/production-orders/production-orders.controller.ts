import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  Headers,
} from '@nestjs/common';
import { ProductionOrdersService } from './production-orders.service';
import {
  CreateProductionOrderDto,
  StartProcessDto,
  CompleteProcessDto,
  CreateProcessDto,
  SplitLotDto,
} from './dto';
import { DepartmentScope } from '../auth/decorators/department-scope.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionMatch } from '../auth/decorators/require-permissions.decorator';

@Controller('production-orders')
@DepartmentScope({ source: 'headers', key: 'x-department-id' })
export class ProductionOrdersController {
  constructor(private readonly service: ProductionOrdersService) {}

  @Post()
  @RequirePermissions('production_orders.create')
  createOrder(@Body() dto: CreateProductionOrderDto, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.createProductionOrder(dto, username);
  }

  @Get()
  @RequirePermissions('production_orders.read')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Headers('x-user-id') userId?: string,
    @Headers('x-department-id') departmentId?: string,
  ) {
    return this.service.findAllOrders(+page, +limit, userId, departmentId);
  }

  /** รายงานสอบกลับล็อต — รับเข้า/จ่ายออกทุกขั้นตอน (แบบ Stock Card) */
  @Get('reports/lot-step-trace')
  @RequirePermissions('production_orders.read')
  getLotStepTraceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderNo') orderNo?: string,
    @Query('lotSearch') lotSearch?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('includeSplitRetired') includeSplitRetired?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.service.getLotStepTraceReport({
      startDate,
      endDate,
      orderNo,
      lotSearch,
      productId: productId ? +productId : undefined,
      status,
      includeSplitRetired:
        includeSplitRetired === '1' ||
        includeSplitRetired === 'true',
      page: +page,
      limit: +limit,
    });
  }

  /** Dept dashboard: lots currently IN_PROGRESS for the user's department */
  @Get('in-progress/my-dept')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getMyDeptInProgress(
    @Headers('x-user-id') userId?: string,
    @Headers('x-department-id') departmentId?: string,
  ) {
    return this.service.getInProgressLotsForMyDept(userId, departmentId);
  }

  /** QR station: next step, department gates, flags for start/complete */
  @Get('lots/:qrCode/station')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotStation(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotStation(qrCode, userId);
  }

  @Get('lots/:qrCode/step-quantities')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotStepQuantities(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotStepQuantities(qrCode, userId);
  }

  @Get('lots/:qrCode/tracking')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotTracking(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotTracking(qrCode, userId);
  }

  @Get('lots/:qrCode/lineage')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotLineage(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotLineage(qrCode, userId);
  }

  @Get('lots/:qrCode/status')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotStatus(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotStatus(qrCode, userId);
  }

  @Post('lots/:qrCode/start')
  @RequirePermissions('production_orders.update')
  startProcess(
    @Param('qrCode') qrCode: string,
    @Body() dto: StartProcessDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.startLotProcess(qrCode, dto, userId);
  }

  @Post('lots/:qrCode/complete')
  @RequirePermissions('production_orders.update')
  completeProcess(
    @Param('qrCode') qrCode: string,
    @Body() dto: CompleteProcessDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.completeLotProcess(qrCode, dto, userId);
  }

  @Post('lots/:qrCode/split')
  @RequirePermissions('production_orders.update')
  splitLot(
    @Param('qrCode') qrCode: string,
    @Body() dto: SplitLotDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.splitLot(qrCode, dto, userId);
  }

  @Post('processes')
  @RequirePermissions('production_orders.manage')
  createProcess(@Body() dto: CreateProcessDto) {
    return this.service.createProcess(dto);
  }

  @Get('processes/all')
  @RequirePermissions('production_orders.read')
  getAllProcesses() {
    return this.service.getAllProcesses();
  }

  @Get(':id')
  @RequirePermissions('production_orders.read')
  findOne(@Param('id') id: string) {
    return this.service.findOrderWithLots(+id);
  }

  @Post(':id/start')
  @RequirePermissions('production_orders.update')
  startOrder(@Param('id') id: string) {
    return this.service.startOrder(+id);
  }
}
