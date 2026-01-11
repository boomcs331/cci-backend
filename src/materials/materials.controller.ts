import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto, CreateMaterialsTypeDto, CreateMaterialsLocationDto, CreateItemsNameDto } from './dto/materials.dto';
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

  @Get()
  async getAllMaterials(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'ASC'
  ) {
    // Log received parameters
    console.log('📥 Received parameters:', {
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    console.log('🔢 Parsed parameters:', {
      pageNum,
      limitNum
    });

    const result = await this.materialsService.findAllMaterials(pageNum, limitNum, search, sortBy, sortOrder);
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
}