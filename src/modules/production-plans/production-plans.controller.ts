import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ProductionPlansService } from './production-plans.service';
import {
  CreateProductionPlanDto,
  UpdateProductionPlanDto,
  AddPlanItemDto,
  UpdatePlanItemDto,
  GenerateProductQrOrdersFromPlanDto,
} from './dto';
import { DepartmentScope } from '../auth/decorators/department-scope.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AuthUserService } from '../auth/services/auth-user.service';

@Controller('production-plans')
@DepartmentScope({ source: 'headers', key: 'x-department-id' })
export class ProductionPlansController {
  constructor(
    private readonly service: ProductionPlansService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Post()
  @RequirePermissions('production_plans.create')
  async create(@Body() dto: CreateProductionPlanDto, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.create(dto, username);
  }

  @Get()
  @RequirePermissions('production_plans.read')
  findAll() {
    return this.service.findAll();
  }

  @Get('materials/availability')
  @RequirePermissions('production_plans.read')
  getMaterialAvailability() {
    return this.service.getMaterialAvailability();
  }

  @Get('materials/reservations')
  @RequirePermissions('production_plans.read')
  getMaterialReservations() {
    return this.service.getMaterialReservations();
  }

  @Get(':id/details')
  @RequirePermissions('production_plans.read')
  getPlanDetails(@Param('id') id: string) {
    return this.service.getPlanDetails(+id);
  }

  @Get(':id')
  @RequirePermissions('production_plans.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('production_plans.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionPlanDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.update(+id, dto, username);
  }

  @Delete(':id')
  @RequirePermissions('production_plans.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Post(':id/items')
  @RequirePermissions('production_plans.update')
  addItem(@Param('id') id: string, @Body() dto: AddPlanItemDto) {
    return this.service.addItem(+id, dto);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('production_plans.update')
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlanItemDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.updateItem(+id, +itemId, dto, username);
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('production_plans.update')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(+id, +itemId);
  }

  @Post(':id/reserve')
  @RequirePermissions('production_plans.reserve')
  async reserve(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.reserveMaterials(+id, username);
  }

  /** สร้าง Production Order + QR lots (แผน reserved หรือ confirmed): จำนวน QR = ceil(quantity / lotSize); บรรทัดเดิมมี order แล้วคืนข้อมูลเดิม */
  @Post(':id/generate-product-qr-orders')
  @RequirePermissions('production_plans.generate_orders')
  async generateProductQrOrders(
    @Param('id') id: string,
    @Body() dto: GenerateProductQrOrdersFromPlanDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.generateProductQrOrdersFromPlan(+id, dto, username);
  }

  @Post(':id/confirm')
  @RequirePermissions('production_plans.approve')
  async confirm(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.confirm(+id, username);
  }

  @Post(':id/confirm-and-issue')
  @RequirePermissions('production_plans.approve', 'production_plans.issue')
  async confirmAndIssue(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.confirmAndIssue(+id, username);
  }

  @Post(':id/issue')
  @RequirePermissions('production_plans.issue')
  async issue(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.issueMaterials(+id, username);
  }

  @Post(':id/cancel')
  @RequirePermissions('production_plans.cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.cancel(+id, username);
  }

  @Post('fix-remaining-quantity')
  @RequirePermissions('production_plans.manage')
  fixRemainingQuantity() {
    return this.service.fixRemainingQuantity();
  }

  @Get('debug/material/:materialCode')
  @RequirePermissions('production_plans.manage')
  debugMaterial(@Param('materialCode') materialCode: string) {
    return this.service.debugMaterialData(materialCode);
  }

  @Get('debug/check-availability/:materialId')
  @RequirePermissions('production_plans.manage')
  async checkMaterialAvailability(@Param('materialId') materialId: string) {
    return this.service.checkMaterialAvailability(+materialId);
  }

  @Post('fix-lots-from-stock')
  @RequirePermissions('production_plans.manage')
  fixLotsFromStock() {
    return this.service.fixLotsFromStock();
  }
}
