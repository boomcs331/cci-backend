import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductWithBomDto, UpdateProductDto, CreateBomDto } from './dto/product.dto';
import { ResponseHelper } from '../common/helpers/response.helper';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get('all')
  async getAllWithoutPagination() {
    const products = await this.service.findAllWithoutPagination();
    return ResponseHelper.success(products, 'Products retrieved successfully');
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'ASC',
    @Query('isActive') isActive?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;

    const result = await this.service.findAll(pageNum, limitNum, search, sortBy, sortOrder, isActiveBool);
    return ResponseHelper.paginated(result.products, result.page, result.limit, result.total, 'Products retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.service.findOne(id);
    return ResponseHelper.success(product, 'Product retrieved successfully');
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const product = await this.service.findByCode(code);
    return ResponseHelper.success(product, 'Product retrieved successfully');
  }

  @Post()
  async create(@Body() dto: CreateProductWithBomDto) {
    const product = await this.service.create(dto, 'admin');
    return ResponseHelper.success(product, 'Product created successfully');
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    const product = await this.service.update(id, dto, 'admin');
    return ResponseHelper.success(product, 'Product updated successfully');
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return ResponseHelper.success(null, 'Product deleted successfully');
  }

  @Get(':id/bom')
  async getBom(@Param('id', ParseIntPipe) id: number) {
    const bom = await this.service.getBom(id);
    return ResponseHelper.success(bom, 'BOM retrieved successfully');
  }

  @Post(':id/bom')
  async addBomItems(@Param('id', ParseIntPipe) id: number, @Body() items: CreateBomDto[]) {
    const bom = await this.service.addBomItems(id, items, 'admin');
    return ResponseHelper.success(bom, 'BOM items added successfully');
  }

  @Delete('bom/:bomId')
  async removeBomItem(@Param('bomId', ParseIntPipe) bomId: number) {
    await this.service.removeBomItem(bomId);
    return ResponseHelper.success(null, 'BOM item removed successfully');
  }

  @Get(':id/calculate')
  async calculateRequirements(@Param('id', ParseIntPipe) id: number, @Query('quantity') quantity: string) {
    const requirements = await this.service.calculateMaterialRequirements(+id, +quantity);
    return ResponseHelper.success(requirements, 'Material requirements calculated successfully');
  }
}
