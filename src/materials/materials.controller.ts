import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto, CreateMaterialsTypeDto, CreateMaterialsLocationDto, CreateItemsNameDto, StockTransactionDto, CreateSupplierDto, UpdateSupplierDto } from './dto/materials.dto';
import { ResponseHelper } from '../common/helpers/response.helper';

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
    const materials = await this.materialsService.findAllMaterialsWithoutPagination();
    return ResponseHelper.success(materials, 'Materials retrieved successfully');
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
    @Query('isActive') isActive?: string
  ) {
    console.log('📥 Received parameters:', {
      page, limit, search, sortBy, sortOrder, locationId, unit, isActive
    });

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const locationIdNum = locationId ? parseInt(locationId) : undefined;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    
    console.log('🔢 Parsed parameters:', {
      pageNum, limitNum, locationIdNum, isActiveBool
    });

    const result = await this.materialsService.findAllMaterials(
      pageNum, limitNum, search, sortBy, sortOrder, locationIdNum, unit, isActiveBool
    );
    return ResponseHelper.paginated(result.materials, result.page, result.limit, result.total, 'Materials retrieved successfully');
  }

  @Get(':id')
  async getMaterialById(@Param('id', ParseIntPipe) id: number) {
    const material = await this.materialsService.findMaterialById(id);
    return ResponseHelper.success(material, 'Material retrieved successfully');
  }

  @Put(':id')
  async updateMaterial(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialDto) {
    console.log('📝 Update material request:', { id, dto });
    try {
      const material = await this.materialsService.updateMaterial(id, dto);
      return ResponseHelper.success(material, 'Material updated successfully');
    } catch (error) {
      console.error('❌ Update material error:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  @Delete(':id')
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterial(id);
    return ResponseHelper.success(null, 'Material deleted successfully');
  }

  // Materials Type endpoints
  @Post('types')
  async createMaterialsType(@Body() dto: CreateMaterialsTypeDto) {
    const type = await this.materialsService.createMaterialsType(dto);
    return ResponseHelper.success(type, 'Materials type created successfully');
  }

  @Get('types/all')
  async getAllMaterialsTypes() {
    const types = await this.materialsService.findAllMaterialsTypes();
    return ResponseHelper.success(types, 'Materials types retrieved successfully');
  }

  // Materials Location endpoints
  @Post('locations')
  async createMaterialsLocation(@Body() dto: CreateMaterialsLocationDto) {
    const location = await this.materialsService.createMaterialsLocation(dto);
    return ResponseHelper.success(location, 'Materials location created successfully');
  }

  @Get('locations/all')
  async getAllMaterialsLocations() {
    const locations = await this.materialsService.findAllMaterialsLocations();
    return ResponseHelper.success(locations, 'Materials locations retrieved successfully');
  }

  // Items Name endpoints
  @Post('items-name')
  async createItemsName(@Body() dto: CreateItemsNameDto) {
    const itemName = await this.materialsService.createItemsName(dto);
    return ResponseHelper.success(itemName, 'Items name created successfully');
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

  // Supplier endpoints
  @Post('suppliers')
  async createSupplier(@Body() dto: CreateSupplierDto) {
    const supplier = await this.materialsService.createSupplier(dto);
    return ResponseHelper.success(supplier, 'Supplier created successfully');
  }

  @Get('suppliers/all')
  async getAllSuppliers() {
    const suppliers = await this.materialsService.findAllSuppliers();
    return ResponseHelper.success(suppliers, 'Suppliers retrieved successfully');
  }

  @Get('suppliers/:id')
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.materialsService.findSupplierById(id);
    return ResponseHelper.success(supplier, 'Supplier retrieved successfully');
  }

  @Put('suppliers/:id')
  async updateSupplier(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
    const supplier = await this.materialsService.updateSupplier(id, dto);
    return ResponseHelper.success(supplier, 'Supplier updated successfully');
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteSupplier(id);
    return ResponseHelper.success(null, 'Supplier deleted successfully');
  }
}