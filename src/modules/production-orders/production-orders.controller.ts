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
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAllOrders(+page, +limit);
  }

  /** Dept dashboard: lots currently IN_PROGRESS for the user's department */
  @Get('in-progress/my-dept')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getMyDeptInProgress(@Headers('x-user-id') userId?: string) {
    return this.service.getInProgressLotsForMyDept(userId);
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

  @Get('lots/:qrCode/tracking')
  @PermissionMatch('any')
  @RequirePermissions('production_orders.read', 'production_orders.update')
  getLotTracking(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.service.getLotTracking(qrCode, userId);
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
