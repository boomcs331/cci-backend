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
import { ProductsService } from './products.service';
import { ProductMasterService } from './product-master.service';
import {
  CreateProductMasterDto,
  UpdateProductMasterDto,
  PaginationDto,
} from './dto/product-master.dto';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { ResponseHelper } from '@app/common';

@Controller('masters/products')
export class ProductsMasterController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productMasterService: ProductMasterService,
  ) {}

  // Locations
  @Post('locations')
  async createLocation(@Body() dto: CreateProductMasterDto) {
    const location = await this.productMasterService.createLocation(dto);
    return ResponseHelper.success(location, 'Location created successfully');
  }

  @Get('locations/all')
  async getAllLocationsForDropdown() {
    const locations =
      await this.productMasterService.findAllLocationsForDropdown();
    return ResponseHelper.success(
      locations,
      'Locations retrieved successfully',
    );
  }

  @Get('locations')
  async getAllLocations(@Query() pagination: PaginationDto) {
    const result = await this.productMasterService.findAllLocations(pagination);
    return ResponseHelper.success(result, 'Locations retrieved successfully');
  }

  @Get('locations/:id')
  async getLocationById(@Param('id', ParseIntPipe) id: number) {
    const location = await this.productMasterService.findLocationById(id);
    return ResponseHelper.success(location, 'Location retrieved successfully');
  }

  @Patch('locations/:id')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const location = await this.productMasterService.updateLocation(id, dto);
    return ResponseHelper.success(location, 'Location updated successfully');
  }

  @Delete('locations/:id')
  async deleteLocation(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteLocation(id);
    return ResponseHelper.success(null, 'Location deleted successfully');
  }

  // Customers
  @Post('customers')
  async createCustomer(@Body() dto: CreateCustomerDto) {
    const customer = await this.productMasterService.createCustomer(dto);
    return ResponseHelper.success(customer, 'Customer created successfully');
  }

  @Get('customers/all')
  async getAllCustomersForDropdown() {
    const customers =
      await this.productMasterService.findAllCustomersForDropdown();
    return ResponseHelper.success(
      customers,
      'Customers retrieved successfully',
    );
  }

  @Get('customers')
  async getAllCustomers(@Query() pagination: PaginationDto) {
    const result = await this.productMasterService.findAllCustomers(pagination);
    return ResponseHelper.success(result, 'Customers retrieved successfully');
  }

  @Get('customers/:id')
  async getCustomerById(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.productMasterService.findCustomerById(id);
    return ResponseHelper.success(customer, 'Customer retrieved successfully');
  }

  @Patch('customers/:id')
  async updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.productMasterService.updateCustomer(id, dto);
    return ResponseHelper.success(customer, 'Customer updated successfully');
  }

  @Delete('customers/:id')
  async deleteCustomer(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteCustomer(id);
    return ResponseHelper.success(null, 'Customer deleted successfully');
  }

  // Product Types
  @Post('types')
  async createType(@Body() dto: CreateProductMasterDto) {
    const type = await this.productMasterService.createType(dto);
    return ResponseHelper.success(type, 'Product type created successfully');
  }

  @Get('types/all')
  async getAllTypesForDropdown() {
    const types = await this.productMasterService.findAllTypesForDropdown();
    return ResponseHelper.success(
      types,
      'Product types retrieved successfully',
    );
  }

  @Get('types')
  async getAllTypes(@Query() pagination: PaginationDto) {
    const result = await this.productMasterService.findAllTypes(pagination);
    return ResponseHelper.success(
      result,
      'Product types retrieved successfully',
    );
  }

  @Get('types/:id')
  async getTypeById(@Param('id', ParseIntPipe) id: number) {
    const type = await this.productMasterService.findTypeById(id);
    return ResponseHelper.success(type, 'Product type retrieved successfully');
  }

  @Patch('types/:id')
  async updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const type = await this.productMasterService.updateType(id, dto);
    return ResponseHelper.success(type, 'Product type updated successfully');
  }

  @Delete('types/:id')
  async deleteType(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteType(id);
    return ResponseHelper.success(null, 'Product type deleted successfully');
  }

  // Product Models
  @Post('models')
  async createModel(@Body() dto: CreateProductMasterDto) {
    const model = await this.productMasterService.createModel(dto);
    return ResponseHelper.success(model, 'Product model created successfully');
  }

  @Get('models/all')
  async getAllModelsForDropdown() {
    const models = await this.productMasterService.findAllModelsForDropdown();
    return ResponseHelper.success(
      models,
      'Product models retrieved successfully',
    );
  }

  @Get('models')
  async getAllModels(@Query() pagination: PaginationDto) {
    const result = await this.productMasterService.findAllModels(pagination);
    return ResponseHelper.success(
      result,
      'Product models retrieved successfully',
    );
  }

  @Get('models/:id')
  async getModelById(@Param('id', ParseIntPipe) id: number) {
    const model = await this.productMasterService.findModelById(id);
    return ResponseHelper.success(
      model,
      'Product model retrieved successfully',
    );
  }

  @Patch('models/:id')
  async updateModel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const model = await this.productMasterService.updateModel(id, dto);
    return ResponseHelper.success(model, 'Product model updated successfully');
  }

  @Delete('models/:id')
  async deleteModel(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteModel(id);
    return ResponseHelper.success(null, 'Product model deleted successfully');
  }

  // Delivery Types
  @Post('delivery-types')
  async createDeliveryType(@Body() dto: CreateProductMasterDto) {
    const type = await this.productMasterService.createDeliveryType(dto);
    return ResponseHelper.success(type, 'Delivery type created successfully');
  }

  @Get('delivery-types/all')
  async getAllDeliveryTypesForDropdown() {
    const types =
      await this.productMasterService.findAllDeliveryTypesForDropdown();
    return ResponseHelper.success(
      types,
      'Delivery types retrieved successfully',
    );
  }

  @Get('delivery-types')
  async getAllDeliveryTypes(@Query() pagination: PaginationDto) {
    const result =
      await this.productMasterService.findAllDeliveryTypes(pagination);
    return ResponseHelper.success(
      result,
      'Delivery types retrieved successfully',
    );
  }

  @Get('delivery-types/:id')
  async getDeliveryTypeById(@Param('id', ParseIntPipe) id: number) {
    const type = await this.productMasterService.findDeliveryTypeById(id);
    return ResponseHelper.success(type, 'Delivery type retrieved successfully');
  }

  @Put('delivery-types/:id')
  async updateDeliveryType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const type = await this.productMasterService.updateDeliveryType(id, dto);
    return ResponseHelper.success(type, 'Delivery type updated successfully');
  }

  @Delete('delivery-types/:id')
  async deleteDeliveryType(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteDeliveryType(id);
    return ResponseHelper.success(null, 'Delivery type deleted successfully');
  }

  // Units
  @Post('units')
  async createUnit(@Body() dto: CreateProductMasterDto) {
    const unit = await this.productMasterService.createUnit(dto);
    return ResponseHelper.success(unit, 'Unit created successfully');
  }

  @Get('units/all')
  async getAllUnitsForDropdown() {
    const units = await this.productMasterService.findAllUnitsForDropdown();
    return ResponseHelper.success(units, 'Units retrieved successfully');
  }

  @Get('units')
  async getAllUnits(@Query() pagination: PaginationDto) {
    const result = await this.productMasterService.findAllUnits(pagination);
    return ResponseHelper.success(result, 'Units retrieved successfully');
  }

  @Get('units/:id')
  async getUnitById(@Param('id', ParseIntPipe) id: number) {
    const unit = await this.productMasterService.findUnitById(id);
    return ResponseHelper.success(unit, 'Unit retrieved successfully');
  }

  @Put('units/:id')
  async updateUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const unit = await this.productMasterService.updateUnit(id, dto);
    return ResponseHelper.success(unit, 'Unit updated successfully');
  }

  @Delete('units/:id')
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteUnit(id);
    return ResponseHelper.success(null, 'Unit deleted successfully');
  }

  // Loading Points
  @Post('loading-points')
  async createLoadingPoint(@Body() dto: CreateProductMasterDto) {
    const point = await this.productMasterService.createLoadingPoint(dto);
    return ResponseHelper.success(point, 'Loading point created successfully');
  }

  @Get('loading-points/all')
  async getAllLoadingPointsForDropdown() {
    const points =
      await this.productMasterService.findAllLoadingPointsForDropdown();
    return ResponseHelper.success(
      points,
      'Loading points retrieved successfully',
    );
  }

  @Get('loading-points')
  async getAllLoadingPoints(@Query() pagination: PaginationDto) {
    const result =
      await this.productMasterService.findAllLoadingPoints(pagination);
    return ResponseHelper.success(
      result,
      'Loading points retrieved successfully',
    );
  }

  @Get('loading-points/:id')
  async getLoadingPointById(@Param('id', ParseIntPipe) id: number) {
    const point = await this.productMasterService.findLoadingPointById(id);
    return ResponseHelper.success(
      point,
      'Loading point retrieved successfully',
    );
  }

  @Put('loading-points/:id')
  async updateLoadingPoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const point = await this.productMasterService.updateLoadingPoint(id, dto);
    return ResponseHelper.success(point, 'Loading point updated successfully');
  }

  @Delete('loading-points/:id')
  async deleteLoadingPoint(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteLoadingPoint(id);
    return ResponseHelper.success(null, 'Loading point deleted successfully');
  }

  // Process Lines
  @Post('process-lines')
  async createProcessLine(@Body() dto: CreateProductMasterDto) {
    const line = await this.productMasterService.createProcessLine(dto);
    return ResponseHelper.success(line, 'Process line created successfully');
  }

  @Get('process-lines/all')
  async getAllProcessLinesForDropdown() {
    const lines =
      await this.productMasterService.findAllProcessLinesForDropdown();
    return ResponseHelper.success(
      lines,
      'Process lines retrieved successfully',
    );
  }

  @Get('process-lines')
  async getAllProcessLines(@Query() pagination: PaginationDto) {
    const result =
      await this.productMasterService.findAllProcessLines(pagination);
    return ResponseHelper.success(
      result,
      'Process lines retrieved successfully',
    );
  }

  @Get('process-lines/:id')
  async getProcessLineById(@Param('id', ParseIntPipe) id: number) {
    const line = await this.productMasterService.findProcessLineById(id);
    return ResponseHelper.success(line, 'Process line retrieved successfully');
  }

  @Put('process-lines/:id')
  async updateProcessLine(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMasterDto,
  ) {
    const line = await this.productMasterService.updateProcessLine(id, dto);
    return ResponseHelper.success(line, 'Process line updated successfully');
  }

  @Delete('process-lines/:id')
  async deleteProcessLine(@Param('id', ParseIntPipe) id: number) {
    await this.productMasterService.deleteProcessLine(id);
    return ResponseHelper.success(null, 'Process line deleted successfully');
  }
}
