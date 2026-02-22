import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateProductWithBomDto, UpdateProductDto, CreateBomDto } from './dto/product.dto';
import { ResponseHelper } from '@app/common';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  async create(@Body() dto: CreateProductWithBomDto) {
    const product = await this.service.create(dto, 'admin');
    return ResponseHelper.success(product, 'Product created successfully');
  }

  @Post('with-bom')
  async createWithBom(@Body() dto: CreateProductWithBomDto) {
    console.log('📦 POST /products/with-bom - Received DTO:', JSON.stringify(dto, null, 2));
    console.log('📋 BOM items count:', dto.bom?.length || 0);
    const product = await this.service.create(dto, 'admin');
    console.log('✅ Product with BOM created successfully:', { id: product.id, productCode: product.productCode, bomCount: product.boms?.length || 0 });
    return ResponseHelper.success(product, 'Product with BOM created successfully');
  }

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

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const product = await this.service.findByCode(code);
    return ResponseHelper.success(product, 'Product retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.service.findOne(id);
    return ResponseHelper.success(product, 'Product retrieved successfully');
  }

  @Patch(':id')
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
  async addBomItems(@Param('id', ParseIntPipe) id: number, @Body() body: CreateBomDto | { items: CreateBomDto[] }) {
    console.log('📦 POST /products/:id/bom - Body:', JSON.stringify(body, null, 2));
    const items = Array.isArray((body as any).items) ? (body as any).items : [body];
    const bom = await this.service.addBomItems(id, items, 'admin');
    return ResponseHelper.success(bom, 'BOM items added successfully');
  }

  @Patch(':id/bom')
  async updateBom(@Param('id', ParseIntPipe) id: number, @Body() body: CreateBomDto[] | { items: CreateBomDto[] }) {
    console.log('📦 PATCH /products/:id/bom - Body:', JSON.stringify(body, null, 2));
    const items = Array.isArray((body as any).items) ? (body as any).items : Array.isArray(body) ? body : [body];
    const bom = await this.service.updateBom(id, items, 'admin');
    return ResponseHelper.success(bom, 'BOM updated successfully');
  }

  @Delete(':id/bom/:bomId')
  async removeBomItem(@Param('id', ParseIntPipe) productId: number, @Param('bomId', ParseIntPipe) bomId: number) {
    await this.service.removeBomItem(bomId);
    return ResponseHelper.success(null, 'BOM item removed successfully');
  }

  @Get(':id/material-requirements')
  async calculateRequirements(@Param('id', ParseIntPipe) id: number, @Query('quantity') quantity: string) {
    const requirements = await this.service.calculateMaterialRequirements(id, +quantity);
    return ResponseHelper.success(requirements, 'Material requirements calculated successfully');
  }
}
