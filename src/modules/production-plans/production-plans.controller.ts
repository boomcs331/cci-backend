import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProductionPlansService } from './production-plans.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto, AddPlanItemDto, UpdatePlanItemDto } from './dto';

@Controller('production-plans')
export class ProductionPlansController {
  constructor(private readonly service: ProductionPlansService) {}

  @Post()
  create(@Body() dto: CreateProductionPlanDto, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.create(dto, username);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('materials/availability')
  getMaterialAvailability() {
    return this.service.getMaterialAvailability();
  }

  @Get('materials/reservations')
  getMaterialReservations() {
    return this.service.getMaterialReservations();
  }

  @Get(':id/details')
  getPlanDetails(@Param('id') id: string) {
    return this.service.getPlanDetails(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductionPlanDto, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.update(+id, dto, username);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddPlanItemDto) {
    return this.service.addItem(+id, dto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlanItemDto,
    @Request() req,
  ) {
    const username = req.user?.username || 'system';
    return this.service.updateItem(+id, +itemId, dto, username);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(+id, +itemId);
  }

  @Post(':id/reserve')
  reserve(@Param('id') id: string, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.reserveMaterials(+id, username);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.confirm(+id, username);
  }

  @Post(':id/confirm-and-issue')
  confirmAndIssue(@Param('id') id: string, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.confirmAndIssue(+id, username);
  }

  @Post(':id/issue')
  issue(@Param('id') id: string, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.issueMaterials(+id, username);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    const username = req.user?.username || 'system';
    return this.service.cancel(+id, username);
  }
}
