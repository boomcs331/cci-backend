import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { MaterialsService } from '../services/materials.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateMaterialsTypeDto,
  CreateMaterialsLocationDto,
  CreateItemsNameDto,
  StockTransactionDto,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../dto/materials.dto';
import { ResponseHelper } from '@app/common';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // Materials endpoints
  @Post()
  async createMaterial(@Body() dto: CreateMaterialDto) {
    const material = await this.materialsService.createMaterial(dto);
    return ResponseHelper.success(material, 'Material created successfully');
  }

  @Get('all')
  async getAllMaterialsWithoutPagination() {
    const materials =
      await this.materialsService.findAllMaterialsWithoutPagination();
    return ResponseHelper.success(
      materials,
      'Materials retrieved successfully',
    );
  }

  @Get('stock')
  async getStockList() {
    const stocks = await this.materialsService.getStockList();
    return ResponseHelper.success(stocks, 'Stock list retrieved successfully');
  }

  @Get()
  async getAllMaterials(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'ASC',
    @Query('locationId') locationId?: string,
    @Query('unit') unit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const locationIdNum = locationId ? parseInt(locationId) : undefined;
    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;

    const result = await this.materialsService.findAllMaterials(
      pageNum,
      limitNum,
      search,
      sortBy,
      sortOrder,
      locationIdNum,
      unit,
      isActiveBool,
    );
    return ResponseHelper.paginated(
      result.materials,
      result.page,
      result.limit,
      result.total,
      'Materials retrieved successfully',
    );
  }

  @Get(':id')
  async getMaterialById(@Param('id', ParseIntPipe) id: number) {
    const material = await this.materialsService.findMaterialById(id);
    return ResponseHelper.success(material, 'Material retrieved successfully');
  }

  @Patch(':id')
  async updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ) {
    console.log('📝 Received DTO:', JSON.stringify(dto, null, 2));
    console.log('📝 matName type:', typeof dto.matName);
    console.log('📝 matName value:', dto.matName);

    if (dto.matName !== undefined && typeof dto.matName !== 'string') {
      dto.matName = String(dto.matName);
    }

    const material = await this.materialsService.updateMaterial(id, dto);
    return ResponseHelper.success(material, 'Material updated successfully');
  }

  @Delete(':id')
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterial(id);
    return ResponseHelper.success(null, 'Material deleted successfully');
  }

  // Stock Transaction endpoints
  @Post('stock/receive')
  async receiveStock(@Body() dto: StockTransactionDto) {
    const result = await this.materialsService.receiveStock(dto);
    return ResponseHelper.success(result, 'Stock received successfully');
  }

  @Post('stock/issue')
  async issueStock(@Body() dto: StockTransactionDto) {
    const result = await this.materialsService.issueStock(dto);
    return ResponseHelper.success(result, 'Stock issued successfully');
  }
}
