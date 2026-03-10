import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ProductionOrdersService } from './production-orders.service';
import { CreateProductionOrderDto, StartProcessDto, CompleteProcessDto, CreateProcessDto } from './dto';

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(private readonly service: ProductionOrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateProductionOrderDto, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.createProductionOrder(dto, username);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAllOrders(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOrderWithLots(+id);
  }

  @Post(':id/start')
  startOrder(@Param('id') id: string) {
    return this.service.startOrder(+id);
  }

  @Post('lots/:qrCode/start')
  startProcess(@Param('qrCode') qrCode: string, @Body() dto: StartProcessDto) {
    return this.service.startLotProcess(qrCode, dto);
  }

  @Post('lots/:qrCode/complete')
  completeProcess(@Param('qrCode') qrCode: string, @Body() dto: CompleteProcessDto) {
    return this.service.completeLotProcess(qrCode, dto);
  }

  @Get('lots/:qrCode/status')
  getLotStatus(@Param('qrCode') qrCode: string) {
    return this.service.getLotStatus(qrCode);
  }

  @Post('processes')
  createProcess(@Body() dto: CreateProcessDto) {
    return this.service.createProcess(dto);
  }

  @Get('processes/all')
  getAllProcesses() {
    return this.service.getAllProcesses();
  }
}
