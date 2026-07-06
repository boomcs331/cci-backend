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
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { MasterService } from '../services/master.service';
import { MaterialsService } from '../services/materials.service';
import {
  CreateMasterDto,
  UpdateMasterDto,
  PaginationDto,
} from '../dto/master.dto';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateMaterialsTypeDto,
  CreateMaterialsLocationDto,
} from '../dto/materials.dto';
import { ResponseHelper } from '@app/common';

@Controller('masters')
export class MasterController {
  constructor(
    private readonly masterService: MasterService,
    private readonly materialsService: MaterialsService,
  ) {}

  // Models
  @Post('models')
  async createModel(@Body() dto: CreateMasterDto) {
    const model = await this.masterService.createModel(dto);
    return ResponseHelper.success(model, 'Model created successfully');
  }

  @Get('models/all')
  async getAllModelsForDropdown() {
    const models = await this.masterService.findAllModelsForDropdown();
    return ResponseHelper.success(models, 'Models retrieved successfully');
  }

  @Get('models')
  async getAllModels(@Query() pagination: PaginationDto) {
    const result = await this.masterService.findAllModels(pagination);
    return ResponseHelper.success(result, 'Models retrieved successfully');
  }

  @Get('models/:id')
  async getModelById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const model = await this.masterService.findModelById(id);
    return ResponseHelper.success(model, 'Model retrieved successfully');
  }

  @Patch('models/:id')
  async updateModel(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    const model = await this.masterService.updateModel(id, dto);
    return ResponseHelper.success(model, 'Model updated successfully');
  }

  @Delete('models/:id')
  async deleteModel(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    await this.masterService.deleteModel(id);
    return ResponseHelper.success(null, 'Model deleted successfully');
  }

  // Delivery Types
  @Post('delivery-types')
  async createDeliveryType(@Body() dto: CreateMasterDto) {
    const deliveryType = await this.masterService.createDeliveryType(dto);
    return ResponseHelper.success(
      deliveryType,
      'Delivery type created successfully',
    );
  }

  @Get('delivery-types/all')
  async getAllDeliveryTypesForDropdown() {
    const types = await this.masterService.findAllDeliveryTypesForDropdown();
    return ResponseHelper.success(
      types,
      'Delivery types retrieved successfully',
    );
  }

  @Get('delivery-types')
  async getAllDeliveryTypes(@Query() pagination: PaginationDto) {
    const result = await this.masterService.findAllDeliveryTypes(pagination);
    return ResponseHelper.success(
      result,
      'Delivery types retrieved successfully',
    );
  }

  @Get('delivery-types/:id')
  async getDeliveryTypeById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const deliveryType = await this.masterService.findDeliveryTypeById(id);
    return ResponseHelper.success(
      deliveryType,
      'Delivery type retrieved successfully',
    );
  }

  @Put('delivery-types/:id')
  async updateDeliveryType(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    const deliveryType = await this.masterService.updateDeliveryType(id, dto);
    return ResponseHelper.success(
      deliveryType,
      'Delivery type updated successfully',
    );
  }

  @Delete('delivery-types/:id')
  async deleteDeliveryType(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    await this.masterService.deleteDeliveryType(id);
    return ResponseHelper.success(null, 'Delivery type deleted successfully');
  }

  // Units
  @Post('units')
  async createUnit(@Body() dto: CreateMasterDto) {
    const unit = await this.masterService.createUnit(dto);
    return ResponseHelper.success(unit, 'Unit created successfully');
  }

  @Get('units/all')
  async getAllUnitsForDropdown() {
    const units = await this.masterService.findAllUnitsForDropdown();
    return ResponseHelper.success(units, 'Units retrieved successfully');
  }

  @Get('units')
  async getAllUnits(@Query() pagination: PaginationDto) {
    const result = await this.masterService.findAllUnits(pagination);
    return ResponseHelper.success(result, 'Units retrieved successfully');
  }

  @Get('units/:id')
  async getUnitById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const unit = await this.masterService.findUnitById(id);
    return ResponseHelper.success(unit, 'Unit retrieved successfully');
  }

  @Put('units/:id')
  async updateUnit(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    const unit = await this.masterService.updateUnit(id, dto);
    return ResponseHelper.success(unit, 'Unit updated successfully');
  }

  @Delete('units/:id')
  async deleteUnit(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    await this.masterService.deleteUnit(id);
    return ResponseHelper.success(null, 'Unit deleted successfully');
  }

  // Loading Points
  @Post('loading-points')
  async createLoadingPoint(@Body() dto: CreateMasterDto) {
    const loadingPoint = await this.masterService.createLoadingPoint(dto);
    return ResponseHelper.success(
      loadingPoint,
      'Loading point created successfully',
    );
  }

  @Get('loading-points/all')
  async getAllLoadingPointsForDropdown() {
    const points = await this.masterService.findAllLoadingPointsForDropdown();
    return ResponseHelper.success(
      points,
      'Loading points retrieved successfully',
    );
  }

  @Get('loading-points')
  async getAllLoadingPoints(@Query() pagination: PaginationDto) {
    const result = await this.masterService.findAllLoadingPoints(pagination);
    return ResponseHelper.success(
      result,
      'Loading points retrieved successfully',
    );
  }

  @Get('loading-points/:id')
  async getLoadingPointById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const loadingPoint = await this.masterService.findLoadingPointById(id);
    return ResponseHelper.success(
      loadingPoint,
      'Loading point retrieved successfully',
    );
  }

  @Put('loading-points/:id')
  async updateLoadingPoint(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    const loadingPoint = await this.masterService.updateLoadingPoint(id, dto);
    return ResponseHelper.success(
      loadingPoint,
      'Loading point updated successfully',
    );
  }

  @Delete('loading-points/:id')
  async deleteLoadingPoint(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    await this.masterService.deleteLoadingPoint(id);
    return ResponseHelper.success(null, 'Loading point deleted successfully');
  }

  // Process Lines
  @Post('process-lines')
  async createProcessLine(@Body() dto: CreateMasterDto) {
    const processLine = await this.masterService.createProcessLine(dto);
    return ResponseHelper.success(
      processLine,
      'Process line created successfully',
    );
  }

  @Get('process-lines/all')
  async getAllProcessLinesForDropdown() {
    const lines = await this.masterService.findAllProcessLinesForDropdown();
    return ResponseHelper.success(
      lines,
      'Process lines retrieved successfully',
    );
  }

  @Get('process-lines')
  async getAllProcessLines(@Query() pagination: PaginationDto) {
    const result = await this.masterService.findAllProcessLines(pagination);
    return ResponseHelper.success(
      result,
      'Process lines retrieved successfully',
    );
  }

  @Get('process-lines/:id')
  async getProcessLineById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    const processLine = await this.masterService.findProcessLineById(id);
    return ResponseHelper.success(
      processLine,
      'Process line retrieved successfully',
    );
  }

  @Put('process-lines/:id')
  async updateProcessLine(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateMasterDto,
  ) {
    const processLine = await this.masterService.updateProcessLine(id, dto);
    return ResponseHelper.success(
      processLine,
      'Process line updated successfully',
    );
  }

  @Delete('process-lines/:id')
  async deleteProcessLine(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    await this.masterService.deleteProcessLine(id);
    return ResponseHelper.success(null, 'Process line deleted successfully');
  }

  // Suppliers
  @Post('suppliers')
  async createSupplier(@Body() dto: CreateSupplierDto) {
    const supplier = await this.materialsService.createSupplier(dto);
    return ResponseHelper.success(supplier, 'Supplier created successfully');
  }

  @Get('suppliers/all')
  async getAllSuppliersForDropdown() {
    const suppliers = await this.materialsService.findAllSuppliersForDropdown();
    return ResponseHelper.success(
      suppliers,
      'Suppliers retrieved successfully',
    );
  }

  @Get('suppliers')
  async getAllSuppliers(@Query() pagination: PaginationDto) {
    const result = await this.materialsService.findAllSuppliers(pagination);
    return ResponseHelper.success(result, 'Suppliers retrieved successfully');
  }

  @Get('suppliers/:id')
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.materialsService.findSupplierById(id);
    return ResponseHelper.success(supplier, 'Supplier retrieved successfully');
  }

  @Patch('suppliers/:id')
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    const supplier = await this.materialsService.updateSupplier(id, dto);
    return ResponseHelper.success(supplier, 'Supplier updated successfully');
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteSupplier(id);
    return ResponseHelper.success(null, 'Supplier deleted successfully');
  }

  // Materials Types
  @Post('materials-types')
  async createMaterialsType(@Body() dto: CreateMaterialsTypeDto) {
    const type = await this.materialsService.createMaterialsType(dto);
    return ResponseHelper.success(type, 'Materials type created successfully');
  }

  @Get('materials-types/all')
  async getAllMaterialsTypesForDropdown() {
    const types =
      await this.materialsService.findAllMaterialsTypesForDropdown();
    return ResponseHelper.success(
      types,
      'Materials types retrieved successfully',
    );
  }

  @Get('materials-types')
  async getAllMaterialsTypes(@Query() pagination: PaginationDto) {
    const result =
      await this.materialsService.findAllMaterialsTypes(pagination);
    return ResponseHelper.success(
      result,
      'Materials types retrieved successfully',
    );
  }

  @Get('materials-types/:id')
  async getMaterialsTypeById(@Param('id', ParseIntPipe) id: number) {
    const type = await this.materialsService.findMaterialsTypeById(id);
    return ResponseHelper.success(
      type,
      'Materials type retrieved successfully',
    );
  }

  @Patch('materials-types/:id')
  async updateMaterialsType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMaterialsTypeDto,
  ) {
    const type = await this.materialsService.updateMaterialsType(id, dto);
    return ResponseHelper.success(type, 'Materials type updated successfully');
  }

  @Delete('materials-types/:id')
  async deleteMaterialsType(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterialsType(id);
    return ResponseHelper.success(null, 'Materials type deleted successfully');
  }

  // Materials Locations
  @Post('materials-locations')
  async createMaterialsLocation(@Body() dto: CreateMaterialsLocationDto) {
    const location = await this.materialsService.createMaterialsLocation(dto);
    return ResponseHelper.success(
      location,
      'Materials location created successfully',
    );
  }

  @Get('materials-locations/all')
  async getAllMaterialsLocationsForDropdown() {
    const locations =
      await this.materialsService.findAllMaterialsLocationsForDropdown();
    return ResponseHelper.success(
      locations,
      'Materials locations retrieved successfully',
    );
  }

  @Get('materials-locations')
  async getAllMaterialsLocations(@Query() pagination: PaginationDto) {
    const result =
      await this.materialsService.findAllMaterialsLocations(pagination);
    return ResponseHelper.success(
      result,
      'Materials locations retrieved successfully',
    );
  }

  @Get('materials-locations/:id')
  async getMaterialsLocationById(@Param('id', ParseIntPipe) id: number) {
    const location = await this.materialsService.findMaterialsLocationById(id);
    return ResponseHelper.success(
      location,
      'Materials location retrieved successfully',
    );
  }

  @Patch('materials-locations/:id')
  async updateMaterialsLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMaterialsLocationDto,
  ) {
    const location = await this.materialsService.updateMaterialsLocation(
      id,
      dto,
    );
    return ResponseHelper.success(
      location,
      'Materials location updated successfully',
    );
  }

  @Delete('materials-locations/:id')
  async deleteMaterialsLocation(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterialsLocation(id);
    return ResponseHelper.success(
      null,
      'Materials location deleted successfully',
    );
  }
}
