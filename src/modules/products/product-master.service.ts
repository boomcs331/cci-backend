import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductType,
  ProductModel,
  ProductDeliveryType,
  ProductUnit,
  ProductLoadingPoint,
  ProductProcessLine,
  ProductLocation,
  Customer,
} from './entities';
import {
  CreateProductMasterDto,
  UpdateProductMasterDto,
  PaginationDto,
} from './dto/product-master.dto';

@Injectable()
export class ProductMasterService {
  constructor(
    @InjectRepository(ProductType) private typeRepo: Repository<ProductType>,
    @InjectRepository(ProductModel) private modelRepo: Repository<ProductModel>,
    @InjectRepository(ProductDeliveryType)
    private deliveryTypeRepo: Repository<ProductDeliveryType>,
    @InjectRepository(ProductUnit) private unitRepo: Repository<ProductUnit>,
    @InjectRepository(ProductLoadingPoint)
    private loadingPointRepo: Repository<ProductLoadingPoint>,
    @InjectRepository(ProductProcessLine)
    private processLineRepo: Repository<ProductProcessLine>,
    @InjectRepository(ProductLocation)
    private locationRepo: Repository<ProductLocation>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  // Product Types
  async createType(dto: CreateProductMasterDto) {
    const exists = await this.typeRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Type code already exists');
    const type = this.typeRepo.create(dto);
    return this.typeRepo.save(type);
  }

  async findAllTypes(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.typeRepo.createQueryBuilder('type');
    if (search)
      query.where('type.code ILIKE :search OR type.name ILIKE :search', {
        search: `%${search}%`,
      });
    query
      .orderBy(`type.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllTypesForDropdown() {
    return this.typeRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findTypeById(id: number) {
    const type = await this.typeRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Type not found');
    return type;
  }

  async updateType(id: number, dto: UpdateProductMasterDto) {
    const type = await this.findTypeById(id);
    Object.assign(type, dto);
    return this.typeRepo.save(type);
  }

  async deleteType(id: number) {
    const type = await this.findTypeById(id);
    type.isActive = false;
    await this.typeRepo.save(type);
  }

  // Product Models
  async createModel(dto: CreateProductMasterDto) {
    const exists = await this.modelRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Model code already exists');
    const model = this.modelRepo.create(dto);
    return this.modelRepo.save(model);
  }

  async findAllModels(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.modelRepo.createQueryBuilder('model');
    if (search)
      query.where('model.code ILIKE :search OR model.name ILIKE :search', {
        search: `%${search}%`,
      });
    query
      .orderBy(`model.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllModelsForDropdown() {
    return this.modelRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findModelById(id: number) {
    const model = await this.modelRepo.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Model not found');
    return model;
  }

  async updateModel(id: number, dto: UpdateProductMasterDto) {
    const model = await this.findModelById(id);
    Object.assign(model, dto);
    return this.modelRepo.save(model);
  }

  async deleteModel(id: number) {
    const model = await this.findModelById(id);
    model.isActive = false;
    await this.modelRepo.save(model);
  }

  // Delivery Types
  async createDeliveryType(dto: CreateProductMasterDto) {
    const exists = await this.deliveryTypeRepo.findOne({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException('Delivery type code already exists');
    const type = this.deliveryTypeRepo.create(dto);
    return this.deliveryTypeRepo.save(type);
  }

  async findAllDeliveryTypes(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.deliveryTypeRepo.createQueryBuilder('deliveryType');
    if (search)
      query.where(
        'deliveryType.code ILIKE :search OR deliveryType.name ILIKE :search',
        { search: `%${search}%` },
      );
    query
      .orderBy(`deliveryType.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllDeliveryTypesForDropdown() {
    return this.deliveryTypeRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findDeliveryTypeById(id: number) {
    const type = await this.deliveryTypeRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Delivery type not found');
    return type;
  }

  async updateDeliveryType(id: number, dto: UpdateProductMasterDto) {
    const type = await this.findDeliveryTypeById(id);
    Object.assign(type, dto);
    return this.deliveryTypeRepo.save(type);
  }

  async deleteDeliveryType(id: number) {
    const type = await this.findDeliveryTypeById(id);
    type.isActive = false;
    await this.deliveryTypeRepo.save(type);
  }

  // Units
  async createUnit(dto: CreateProductMasterDto) {
    const exists = await this.unitRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Unit code already exists');
    const unit = this.unitRepo.create(dto);
    return this.unitRepo.save(unit);
  }

  async findAllUnits(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.unitRepo.createQueryBuilder('unit');
    if (search)
      query.where('unit.code ILIKE :search OR unit.name ILIKE :search', {
        search: `%${search}%`,
      });
    query
      .orderBy(`unit.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllUnitsForDropdown() {
    return this.unitRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findUnitById(id: number) {
    const unit = await this.unitRepo.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async updateUnit(id: number, dto: UpdateProductMasterDto) {
    const unit = await this.findUnitById(id);
    Object.assign(unit, dto);
    return this.unitRepo.save(unit);
  }

  async deleteUnit(id: number) {
    const unit = await this.findUnitById(id);
    unit.isActive = false;
    await this.unitRepo.save(unit);
  }

  // Loading Points
  async createLoadingPoint(dto: CreateProductMasterDto) {
    const exists = await this.loadingPointRepo.findOne({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException('Loading point code already exists');
    const point = this.loadingPointRepo.create(dto);
    return this.loadingPointRepo.save(point);
  }

  async findAllLoadingPoints(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.loadingPointRepo.createQueryBuilder('loadingPoint');
    if (search)
      query.where(
        'loadingPoint.code ILIKE :search OR loadingPoint.name ILIKE :search',
        { search: `%${search}%` },
      );
    query
      .orderBy(`loadingPoint.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllLoadingPointsForDropdown() {
    return this.loadingPointRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findLoadingPointById(id: number) {
    const point = await this.loadingPointRepo.findOne({ where: { id } });
    if (!point) throw new NotFoundException('Loading point not found');
    return point;
  }

  async updateLoadingPoint(id: number, dto: UpdateProductMasterDto) {
    const point = await this.findLoadingPointById(id);
    Object.assign(point, dto);
    return this.loadingPointRepo.save(point);
  }

  async deleteLoadingPoint(id: number) {
    const point = await this.findLoadingPointById(id);
    point.isActive = false;
    await this.loadingPointRepo.save(point);
  }

  // Process Lines
  async createProcessLine(dto: CreateProductMasterDto) {
    const exists = await this.processLineRepo.findOne({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Process line code already exists');
    const line = this.processLineRepo.create(dto);
    return this.processLineRepo.save(line);
  }

  async findAllProcessLines(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.processLineRepo.createQueryBuilder('processLine');
    if (search)
      query.where(
        'processLine.code ILIKE :search OR processLine.name ILIKE :search',
        { search: `%${search}%` },
      );
    query
      .orderBy(`processLine.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllProcessLinesForDropdown() {
    return this.processLineRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findProcessLineById(id: number) {
    const line = await this.processLineRepo.findOne({ where: { id } });
    if (!line) throw new NotFoundException('Process line not found');
    return line;
  }

  async updateProcessLine(id: number, dto: UpdateProductMasterDto) {
    const line = await this.findProcessLineById(id);
    Object.assign(line, dto);
    return this.processLineRepo.save(line);
  }

  async deleteProcessLine(id: number) {
    const line = await this.findProcessLineById(id);
    line.isActive = false;
    await this.processLineRepo.save(line);
  }

  // Locations
  async createLocation(dto: CreateProductMasterDto) {
    const exists = await this.locationRepo.findOne({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Location code already exists');
    const location = this.locationRepo.create(dto);
    return this.locationRepo.save(location);
  }

  async findAllLocations(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.locationRepo.createQueryBuilder('location');
    if (search)
      query.where(
        'location.code ILIKE :search OR location.name ILIKE :search',
        { search: `%${search}%` },
      );
    query
      .orderBy(`location.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllLocationsForDropdown() {
    return this.locationRepo.find({ order: { id: 'ASC' } });
  }

  async findLocationById(id: number) {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async updateLocation(id: number, dto: UpdateProductMasterDto) {
    const location = await this.findLocationById(id);
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async deleteLocation(id: number) {
    const location = await this.findLocationById(id);
    await this.locationRepo.remove(location);
  }

  // Customers
  async createCustomer(dto: any) {
    const exists = await this.customerRepo.findOne({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Customer code already exists');
    const customer = this.customerRepo.create(dto);
    return this.customerRepo.save(customer);
  }

  async findAllCustomers(pagination: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = pagination;
    const query = this.customerRepo.createQueryBuilder('customer');
    if (search)
      query.where(
        'customer.code ILIKE :search OR customer.name ILIKE :search',
        { search: `%${search}%` },
      );
    query
      .orderBy(`customer.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllCustomersForDropdown() {
    return this.customerRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findCustomerById(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(id: number, dto: any) {
    const customer = await this.findCustomerById(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async deleteCustomer(id: number) {
    const customer = await this.findCustomerById(id);
    customer.isActive = false;
    await this.customerRepo.save(customer);
  }
}
