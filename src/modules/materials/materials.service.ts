import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Material, MaterialsType, MaterialsLocation, MaterialsStock, Supplier } from './entities';
import { CreateMaterialDto, UpdateMaterialDto, CreateMaterialsTypeDto, CreateMaterialsLocationDto, StockTransactionDto, CreateSupplierDto, UpdateSupplierDto } from './dto/materials.dto';
import { PaginationDto } from './dto/master.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialsType)
    private materialsTypeRepository: Repository<MaterialsType>,
    @InjectRepository(MaterialsLocation)
    private materialsLocationRepository: Repository<MaterialsLocation>,
    @InjectRepository(MaterialsStock)
    private materialsStockRepository: Repository<MaterialsStock>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private dataSource: DataSource,
  ) {}

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.materialRepository.findOne({ where: { matCode: dto.matCode } });
    if (existing) throw new ConflictException('Material code already exists');

    const material = this.materialRepository.create({
      matCode: dto.matCode,
      matName: dto.matName,
      matTypeId: dto.matTypeId,
      defaultLocationId: dto.defaultLocationId,
      lr: dto.lr,
      lotSize: dto.lotSize,
      minStock: dto.minStock,
      supplierId: dto.supplierId,
      modelId: dto.modelId,
      deliveryTypeId: dto.deliveryTypeId,
      unitId: dto.unitId,
      scale: dto.scale,
      loadingPointId: dto.loadingPointId,
      processLineId: dto.processLineId,
      isActive: dto.isActive ?? true,
      createBy: dto.createBy ?? 'system'
    });
    
    return await this.dataSource.transaction(async manager => {
      const savedMaterial = await manager.save(Material, material);

      const stock = manager.create(MaterialsStock, {
        materialId: savedMaterial.id,
        totalQty: dto.initialStock ?? 0,
        availableQty: dto.initialStock ?? 0,
        reservedQty: 0
      });
      await manager.save(stock);

      return savedMaterial;
    });
  }

  async findAllMaterialsWithoutPagination(): Promise<Material[]> {
    return await this.materialRepository.find({
      relations: ['materialsType', 'defaultLocation', 'supplier', 'model', 'deliveryType', 'unitMaster', 'loadingPoint', 'processLine', 'stock'],
      where: { isActive: true },
      order: { id: 'ASC' }
    });
  }

  async findAllMaterials(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    sortBy: string = 'id', 
    sortOrder: string = 'ASC',
    locationId?: number,
    unit?: string,
    isActive?: boolean
  ): Promise<{
    materials: Material[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.materialsType', 'materialsType')
      .leftJoinAndSelect('material.defaultLocation', 'defaultLocation')
      .leftJoinAndSelect('material.supplier', 'supplier')
      .leftJoinAndSelect('material.model', 'model')
      .leftJoinAndSelect('material.deliveryType', 'deliveryType')
      .leftJoinAndSelect('material.unitMaster', 'unitMaster')
      .leftJoinAndSelect('material.loadingPoint', 'loadingPoint')
      .leftJoinAndSelect('material.processLine', 'processLine')
      .leftJoinAndSelect('material.stock', 'stock');

    if (isActive !== undefined) {
      queryBuilder.where('material.isActive = :isActive', { isActive });
    } else {
      queryBuilder.where('material.isActive = :isActive', { isActive: true });
    }

    if (locationId) {
      queryBuilder.andWhere('material.defaultLocationId = :locationId', { locationId });
    }

    if (unit) {
      queryBuilder.andWhere('unitMaster.name ILIKE :unit', { unit: `%${unit}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(material.matCode ILIKE :search OR material.matName ILIKE :search OR materialsType.name ILIKE :search OR defaultLocation.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortColumns = ['id', 'matCode', 'createDate', 'updateDate'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    queryBuilder.orderBy(`material.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const materials = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      materials,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findMaterialById(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['materialsType', 'defaultLocation', 'supplier', 'model', 'deliveryType', 'unitMaster', 'loadingPoint', 'processLine', 'stock']
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async updateMaterial(id: number, dto: UpdateMaterialDto): Promise<Material> {
    
    return await this.dataSource.transaction(async manager => {
      const material = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'supplier', 'model', 'deliveryType', 'unitMaster', 'loadingPoint', 'processLine', 'stock']
      });
      if (!material) throw new NotFoundException('Material not found');

      if (dto.matTypeId) {
        const typeExists = await manager.findOne(MaterialsType, { where: { id: dto.matTypeId } });
        if (!typeExists) throw new NotFoundException('Material type not found');
      }

      if (dto.defaultLocationId) {
        const locationExists = await manager.findOne(MaterialsLocation, { where: { id: dto.defaultLocationId } });
        if (!locationExists) throw new NotFoundException('Location not found');
      }

      if (dto.supplierId) {
        const supplierExists = await manager.findOne(Supplier, { where: { id: dto.supplierId } });
        if (!supplierExists) throw new NotFoundException('Supplier not found');
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (dto.matCode !== undefined) {
        updateFields.push(`mat_code = $${updateFields.length + 1}`);
        updateValues.push(dto.matCode);
      }
      if (dto.matName !== undefined) {
        updateFields.push(`mat_name = $${updateFields.length + 1}`);
        updateValues.push(dto.matName);
      }
      if (dto.matTypeId !== undefined) {
        updateFields.push(`mat_type_id = $${updateFields.length + 1}`);
        updateValues.push(dto.matTypeId);
      }
      if (dto.defaultLocationId !== undefined) {
        updateFields.push(`default_location_id = $${updateFields.length + 1}`);
        updateValues.push(dto.defaultLocationId);
      }
      if (dto.lr !== undefined) {
        updateFields.push(`lr = $${updateFields.length + 1}`);
        updateValues.push(dto.lr);
      }
      if (dto.lotSize !== undefined) {
        updateFields.push(`lot_size = $${updateFields.length + 1}`);
        updateValues.push(dto.lotSize);
      }
      if (dto.unit !== undefined) {
        updateFields.push(`unit = $${updateFields.length + 1}`);
        updateValues.push(dto.unit);
      }
      if (dto.supplierId !== undefined) {
        updateFields.push(`supplier_id = $${updateFields.length + 1}`);
        updateValues.push(dto.supplierId);
      }
      if (dto.isActive !== undefined) {
        updateFields.push(`is_active = $${updateFields.length + 1}`);
        updateValues.push(dto.isActive);
      }
      
      updateFields.push(`update_date = $${updateFields.length + 1}`);
      updateValues.push(new Date());
      updateFields.push(`update_by = $${updateFields.length + 1}`);
      updateValues.push(dto.updateBy ?? 'system');
      
      if (updateFields.length > 0) {
        const sql = `UPDATE materials SET ${updateFields.join(', ')} WHERE id = $${updateFields.length + 1}`;
        updateValues.push(id);
        await manager.query(sql, updateValues);
      }
      
      const reloadedMaterial = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'supplier', 'model', 'deliveryType', 'unitMaster', 'loadingPoint', 'processLine', 'stock']
      });
      
      if (!reloadedMaterial) {
        throw new NotFoundException('Material not found after update');
      }

      return reloadedMaterial;
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    return await this.dataSource.transaction(async manager => {
      const material = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'supplier', 'model', 'deliveryType', 'unitMaster', 'loadingPoint', 'processLine', 'stock']
      });
      if (!material) throw new NotFoundException('Material not found');

      await manager.query('DELETE FROM materials_stock WHERE material_id = $1', [id]);
      await manager.query('DELETE FROM materials WHERE id = $1', [id]);
    });
  }

  async createMaterialsType(dto: CreateMaterialsTypeDto): Promise<MaterialsType> {
    const existing = await this.materialsTypeRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Type code already exists');

    const type = this.materialsTypeRepository.create(dto);
    return await this.materialsTypeRepository.save(type);
  }

  async findAllMaterialsTypes(pagination: PaginationDto): Promise<any> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [types, total] = await this.materialsTypeRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'ASC' }
    });

    return {
      data: types,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findMaterialsTypeById(id: number): Promise<MaterialsType> {
    const type = await this.materialsTypeRepository.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Materials type not found');
    return type;
  }

  async updateMaterialsType(id: number, dto: CreateMaterialsTypeDto): Promise<MaterialsType> {
    const type = await this.findMaterialsTypeById(id);
    Object.assign(type, dto);
    return await this.materialsTypeRepository.save(type);
  }

  async deleteMaterialsType(id: number): Promise<void> {
    const type = await this.findMaterialsTypeById(id);
    await this.materialsTypeRepository.remove(type);
  }

  async createMaterialsLocation(dto: CreateMaterialsLocationDto): Promise<MaterialsLocation> {
    const existing = await this.materialsLocationRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Location code already exists');

    const location = this.materialsLocationRepository.create(dto);
    return await this.materialsLocationRepository.save(location);
  }

  async findAllMaterialsLocations(pagination: PaginationDto): Promise<any> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [locations, total] = await this.materialsLocationRepository.findAndCount({
      skip,
      take: limit,
      order: { id: 'ASC' }
    });

    return {
      data: locations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findMaterialsLocationById(id: number): Promise<MaterialsLocation> {
    const location = await this.materialsLocationRepository.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Materials location not found');
    return location;
  }

  async updateMaterialsLocation(id: number, dto: CreateMaterialsLocationDto): Promise<MaterialsLocation> {
    const location = await this.findMaterialsLocationById(id);
    Object.assign(location, dto);
    return await this.materialsLocationRepository.save(location);
  }

  async deleteMaterialsLocation(id: number): Promise<void> {
    const location = await this.findMaterialsLocationById(id);
    await this.materialsLocationRepository.remove(location);
  }

  async receiveStock(dto: StockTransactionDto): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
      if (!material) throw new NotFoundException('Material not found');
      
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (!stock) throw new NotFoundException('Stock record not found');
      
      const newTotalQty = stock.totalQty + dto.quantity;
      const newAvailableQty = stock.availableQty + dto.quantity;
      
      await manager.query(
        'UPDATE materials_stock SET total_qty = $1, available_qty = $2, update_date = $3 WHERE material_id = $4',
        [newTotalQty, newAvailableQty, new Date(), dto.materialId]
      );
      
      return {
        materialId: dto.materialId,
        receivedQuantity: dto.quantity,
        newTotalQty,
        newAvailableQty,
        remark: dto.remark
      };
    });
  }

  async issueStock(dto: StockTransactionDto): Promise<any> {
    return await this.dataSource.transaction(async manager => {
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
      if (!material) throw new NotFoundException('Material not found');
      
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (!stock) throw new NotFoundException('Stock record not found');
      
      if (stock.availableQty < dto.quantity) {
        throw new ConflictException(`Insufficient stock. Available: ${stock.availableQty}, Requested: ${dto.quantity}`);
      }
      
      const newTotalQty = stock.totalQty - dto.quantity;
      const newAvailableQty = stock.availableQty - dto.quantity;
      
      await manager.query(
        'UPDATE materials_stock SET total_qty = $1, available_qty = $2, update_date = $3 WHERE material_id = $4',
        [newTotalQty, newAvailableQty, new Date(), dto.materialId]
      );
      
      return {
        materialId: dto.materialId,
        issuedQuantity: dto.quantity,
        newTotalQty,
        newAvailableQty,
        remark: dto.remark
      };
    });
  }

  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const existing = await this.supplierRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Supplier code already exists');

    const supplier = this.supplierRepository.create({
      ...dto,
      is_active: dto.is_active ?? true,
      create_by: dto.createBy ?? 'system'
    });
    return await this.supplierRepository.save(supplier);
  }

  async findAllSuppliers(pagination: PaginationDto): Promise<any> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [suppliers, total] = await this.supplierRepository.findAndCount({
      where: { is_active: true },
      skip,
      take: limit,
      order: { id: 'ASC' }
    });

    return {
      data: suppliers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findSupplierById(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findSupplierById(id);
    Object.assign(supplier, { ...dto, update_by: dto.updateBy ?? 'system' });
    return await this.supplierRepository.save(supplier);
  }

  async deleteSupplier(id: number): Promise<void> {
    const supplier = await this.findSupplierById(id);
    await this.supplierRepository.remove(supplier);
  }

  async findAllSuppliersForDropdown(): Promise<Supplier[]> {
    return await this.supplierRepository.find({ where: { is_active: true }, order: { id: 'ASC' } });
  }

  async findAllMaterialsTypesForDropdown(): Promise<MaterialsType[]> {
    return await this.materialsTypeRepository.find({ order: { id: 'ASC' } });
  }

  async findAllMaterialsLocationsForDropdown(): Promise<MaterialsLocation[]> {
    return await this.materialsLocationRepository.find({ order: { id: 'ASC' } });
  }

  async getStockList(): Promise<any[]> {
    const materials = await this.materialRepository.find({
      relations: ['stock', 'unitMaster'],
      where: { isActive: true },
      order: { matCode: 'ASC' }
    });

    return materials.map(material => ({
      id: material.id,
      matCode: material.matCode,
      matName: material.matName,
      currentStock: material.stock?.totalQty || 0,
      reservedStock: material.stock?.reservedQty || 0,
      availableStock: material.stock?.availableQty || 0,
      minStock: material.minStock || 0,
      unit: material.unitMaster?.name || '-'
    }));
  }
}
