import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateProductionOrderDto, UpdateProductionOrderDto, IssueMaterialsDto } from './dto/production.dto';
import { ResponseHelper } from '../common/helpers/response.helper';

@Controller('production-orders')
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  @Get('all')
  async getAllWithoutPagination() {
    const orders = await this.service.findAllWithoutPagination();
    return ResponseHelper.success(orders, 'Production orders retrieved successfully');
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'DESC',
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await this.service.findAll(pageNum, limitNum, search, sortBy, sortOrder, status);
    return ResponseHelper.paginated(result.orders, result.page, result.limit, result.total, 'Production orders retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.service.findOne(id);
    return ResponseHelper.success(order, 'Production order retrieved successfully');
  }

  @Get('order-no/:orderNo')
  async findByOrderNo(@Param('orderNo') orderNo: string) {
    const order = await this.service.findByOrderNo(orderNo);
    return ResponseHelper.success(order, 'Production order retrieved successfully');
  }

  @Post()
  async create(@Body() dto: CreateProductionOrderDto) {
    const order = await this.service.create(dto, 'admin');
    return ResponseHelper.success(order, 'Production order created successfully');
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductionOrderDto) {
    const order = await this.service.update(id, dto, 'admin');
    return ResponseHelper.success(order, 'Production order updated successfully');
  }

  @Get(':id/requirements')
  async getRequirements(@Param('id', ParseIntPipe) id: number) {
    const requirements = await this.service.getRequirements(id);
    return ResponseHelper.success(requirements, 'Material requirements retrieved successfully');
  }

  @Get(':id/requirements/by-type/:type')
  async getRequirementsByType(@Param('id', ParseIntPipe) id: number, @Param('type') type: string) {
    const requirements = await this.service.getRequirementsByType(id, type);
    return ResponseHelper.success(requirements, 'Material requirements retrieved successfully');
  }

  @Post(':id/issue-materials')
  async issueMaterials(@Param('id', ParseIntPipe) id: number, @Body() dto: IssueMaterialsDto) {
    const result = await this.service.issueMaterials(id, dto, 'admin');
    return ResponseHelper.success(result, 'Materials issued successfully');
  }
}
