import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model, DeliveryType, Unit, LoadingPoint, ProcessLine } from './entities';
import { CreateMasterDto, UpdateMasterDto, PaginationDto } from './dto/master.dto';

@Injectable()
export class MasterService {
  constructor(
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    @InjectRepository(DeliveryType)
    private deliveryTypeRepository: Repository<DeliveryType>,
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    @InjectRepository(LoadingPoint)
    private loadingPointRepository: Repository<LoadingPoint>,
    @InjectRepository(ProcessLine)
    private processLineRepository: Repository<ProcessLine>,
  ) {}

  // Models
  async createModel(dto: CreateMasterDto): Promise<Model> {
    const existing = await this.modelRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Model code already exists');
    const model = this.modelRepository.create({ ...dto, createBy: dto.createBy ?? 'system' });
    return await this.modelRepository.save(model);
  }

  async findAllModels(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.modelRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findModelById(id: number): Promise<Model> {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Model not found');
    return model;
  }

  async updateModel(id: number, dto: UpdateMasterDto): Promise<Model> {
    const model = await this.findModelById(id);
    Object.assign(model, { ...dto, updateBy: dto.updateBy ?? 'system' });
    return await this.modelRepository.save(model);
  }

  async deleteModel(id: number): Promise<void> {
    const model = await this.findModelById(id);
    await this.modelRepository.remove(model);
  }

  async findAllModelsForDropdown(): Promise<Model[]> {
    return await this.modelRepository.find({ order: { id: 'ASC' } });
  }

  // Delivery Types
  async createDeliveryType(dto: CreateMasterDto): Promise<DeliveryType> {
    const existing = await this.deliveryTypeRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Delivery type code already exists');
    const deliveryType = this.deliveryTypeRepository.create({ ...dto, createBy: dto.createBy ?? 'system' });
    return await this.deliveryTypeRepository.save(deliveryType);
  }

  async findAllDeliveryTypes(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.deliveryTypeRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDeliveryTypeById(id: number): Promise<DeliveryType> {
    const deliveryType = await this.deliveryTypeRepository.findOne({ where: { id } });
    if (!deliveryType) throw new NotFoundException('Delivery type not found');
    return deliveryType;
  }

  async updateDeliveryType(id: number, dto: UpdateMasterDto): Promise<DeliveryType> {
    const deliveryType = await this.findDeliveryTypeById(id);
    Object.assign(deliveryType, { ...dto, updateBy: dto.updateBy ?? 'system' });
    return await this.deliveryTypeRepository.save(deliveryType);
  }

  async deleteDeliveryType(id: number): Promise<void> {
    const deliveryType = await this.findDeliveryTypeById(id);
    await this.deliveryTypeRepository.remove(deliveryType);
  }

  async findAllDeliveryTypesForDropdown(): Promise<DeliveryType[]> {
    return await this.deliveryTypeRepository.find({ order: { id: 'ASC' } });
  }

  // Units
  async createUnit(dto: CreateMasterDto): Promise<Unit> {
    const existing = await this.unitRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Unit code already exists');
    const unit = this.unitRepository.create({ ...dto, createBy: dto.createBy ?? 'system' });
    return await this.unitRepository.save(unit);
  }

  async findAllUnits(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.unitRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUnitById(id: number): Promise<Unit> {
    const unit = await this.unitRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async updateUnit(id: number, dto: UpdateMasterDto): Promise<Unit> {
    const unit = await this.findUnitById(id);
    Object.assign(unit, { ...dto, updateBy: dto.updateBy ?? 'system' });
    return await this.unitRepository.save(unit);
  }

  async deleteUnit(id: number): Promise<void> {
    const unit = await this.findUnitById(id);
    await this.unitRepository.remove(unit);
  }

  async findAllUnitsForDropdown(): Promise<Unit[]> {
    return await this.unitRepository.find({ order: { id: 'ASC' } });
  }

  // Loading Points
  async createLoadingPoint(dto: CreateMasterDto): Promise<LoadingPoint> {
    const existing = await this.loadingPointRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Loading point code already exists');
    const loadingPoint = this.loadingPointRepository.create({ ...dto, createBy: dto.createBy ?? 'system' });
    return await this.loadingPointRepository.save(loadingPoint);
  }

  async findAllLoadingPoints(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.loadingPointRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLoadingPointById(id: number): Promise<LoadingPoint> {
    const loadingPoint = await this.loadingPointRepository.findOne({ where: { id } });
    if (!loadingPoint) throw new NotFoundException('Loading point not found');
    return loadingPoint;
  }

  async updateLoadingPoint(id: number, dto: UpdateMasterDto): Promise<LoadingPoint> {
    const loadingPoint = await this.findLoadingPointById(id);
    Object.assign(loadingPoint, { ...dto, updateBy: dto.updateBy ?? 'system' });
    return await this.loadingPointRepository.save(loadingPoint);
  }

  async deleteLoadingPoint(id: number): Promise<void> {
    const loadingPoint = await this.findLoadingPointById(id);
    await this.loadingPointRepository.remove(loadingPoint);
  }

  async findAllLoadingPointsForDropdown(): Promise<LoadingPoint[]> {
    return await this.loadingPointRepository.find({ order: { id: 'ASC' } });
  }

  // Process Lines
  async createProcessLine(dto: CreateMasterDto): Promise<ProcessLine> {
    const existing = await this.processLineRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Process line code already exists');
    const processLine = this.processLineRepository.create({ ...dto, createBy: dto.createBy ?? 'system' });
    return await this.processLineRepository.save(processLine);
  }

  async findAllProcessLines(pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.processLineRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProcessLineById(id: number): Promise<ProcessLine> {
    const processLine = await this.processLineRepository.findOne({ where: { id } });
    if (!processLine) throw new NotFoundException('Process line not found');
    return processLine;
  }

  async updateProcessLine(id: number, dto: UpdateMasterDto): Promise<ProcessLine> {
    const processLine = await this.findProcessLineById(id);
    Object.assign(processLine, { ...dto, updateBy: dto.updateBy ?? 'system' });
    return await this.processLineRepository.save(processLine);
  }

  async deleteProcessLine(id: number): Promise<void> {
    const processLine = await this.findProcessLineById(id);
    await this.processLineRepository.remove(processLine);
  }

  async findAllProcessLinesForDropdown(): Promise<ProcessLine[]> {
    return await this.processLineRepository.find({ order: { id: 'ASC' } });
  }
}
