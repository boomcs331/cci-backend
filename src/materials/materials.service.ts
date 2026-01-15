import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Material, MaterialsType, MaterialsLocation, ItemsName, MaterialsStock, Supplier } from './entities';
import { CreateMaterialDto, UpdateMaterialDto, CreateMaterialsTypeDto, CreateMaterialsLocationDto, CreateItemsNameDto, StockTransactionDto, CreateSupplierDto, UpdateSupplierDto } from './dto/materials.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialsType)
    private materialsTypeRepository: Repository<MaterialsType>,
    @InjectRepository(MaterialsLocation)
    private materialsLocationRepository: Repository<MaterialsLocation>,
    @InjectRepository(ItemsName)
    private itemsNameRepository: Repository<ItemsName>,
    @InjectRepository(MaterialsStock)
    private materialsStockRepository: Repository<MaterialsStock>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private dataSource: DataSource,
  ) {}

  // Materials CRUD
  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    const existing = await this.materialRepository.findOne({ where: { matCode: dto.matCode } });
    if (existing) throw new ConflictException('Material code already exists');

    return await this.dataSource.transaction(async manager => {
      // Create material
      const material = manager.create(Material, {
        ...dto,
        isActive: dto.isActive ?? true,
        createBy: dto.createBy ?? 'system'
      });
      const savedMaterial = await manager.save(material);

      // Create item name
      const itemName = manager.create(ItemsName, {
        materialId: savedMaterial.id,
        name: dto.name,
        description: dto.description,
        active: true,
        createBy: dto.createBy ?? 'system'
      });
      await manager.save(itemName);

      // Create initial stock
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
    console.log('📊 Service received:', { page, limit, search, sortBy, sortOrder, locationId, unit, isActive });
    
    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.materialsType', 'materialsType')
      .leftJoinAndSelect('material.defaultLocation', 'defaultLocation')
      .leftJoinAndSelect('material.supplier', 'supplier')
      .leftJoinAndSelect('material.stock', 'stock')
      .leftJoinAndSelect('material.itemsName', 'itemsName');

    // Base filter for isActive
    if (isActive !== undefined) {
      queryBuilder.where('material.isActive = :isActive', { isActive });
    } else {
      queryBuilder.where('material.isActive = :isActive', { isActive: true });
    }

    // Location filter
    if (locationId) {
      queryBuilder.andWhere('material.defaultLocationId = :locationId', { locationId });
    }

    // Unit filter
    if (unit) {
      queryBuilder.andWhere('material.unit ILIKE :unit', { unit: `%${unit}%` });
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(material.matCode ILIKE :search OR materialsType.name ILIKE :search OR defaultLocation.name ILIKE :search OR itemsName.name ILIKE :search OR material.unit ILIKE :search)',
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

    console.log(`📄 Query result: ${materials.length} items, total: ${total}`);

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
      relations: ['materialsType', 'defaultLocation', 'supplier', 'itemsName', 'stock']
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async updateMaterial(id: number, dto: UpdateMaterialDto): Promise<Material> {
    console.log('🔍 Update Material Service - Input:', { id, dto });
    
    return await this.dataSource.transaction(async manager => {
      // Update material
      const material = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'itemsName', 'stock']
      });
      if (!material) throw new NotFoundException('Material not found');
      
      console.log('📋 Current Material:', {
        id: material.id,
        matCode: material.matCode,
        matTypeId: material.matTypeId,
        defaultLocationId: material.defaultLocationId
      });

      // Validate matTypeId if provided
      if (dto.matTypeId) {
        console.log('🔍 Validating matTypeId:', dto.matTypeId);
        const typeExists = await manager.findOne(MaterialsType, { where: { id: dto.matTypeId } });
        if (!typeExists) throw new NotFoundException('Material type not found');
        console.log('✅ Material type exists');
      }

      // Validate defaultLocationId if provided
      if (dto.defaultLocationId) {
        console.log('🔍 Validating defaultLocationId:', dto.defaultLocationId);
        const locationExists = await manager.findOne(MaterialsLocation, { where: { id: dto.defaultLocationId } });
        if (!locationExists) throw new NotFoundException('Location not found');
        console.log('✅ Location exists');
      }

      // Validate supplierId if provided
      if (dto.supplierId) {
        const supplierExists = await manager.findOne(Supplier, { where: { id: dto.supplierId } });
        if (!supplierExists) throw new NotFoundException('Supplier not found');
      }

      // Update material fields using raw query
      console.log('🔄 Updating fields with raw SQL...');
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (dto.matCode !== undefined) {
        updateFields.push(`mat_code = $${updateFields.length + 1}`);
        updateValues.push(dto.matCode);
        console.log('📝 Will update matCode to:', dto.matCode);
      }
      if (dto.matTypeId !== undefined) {
        updateFields.push(`mat_type_id = $${updateFields.length + 1}`);
        updateValues.push(dto.matTypeId);
        console.log('📝 Will update matTypeId to:', dto.matTypeId);
      }
      if (dto.defaultLocationId !== undefined) {
        updateFields.push(`default_location_id = $${updateFields.length + 1}`);
        updateValues.push(dto.defaultLocationId);
        console.log('📝 Will update defaultLocationId to:', dto.defaultLocationId);
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
        
        console.log('🔧 Executing SQL:', sql);
        console.log('🔧 With values:', updateValues);
        
        await manager.query(sql, updateValues);
        console.log('✅ Raw SQL update completed');
      }
      
      // Reload to get fresh data
      const reloadedMaterial = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'itemsName', 'stock']
      });
      
      if (!reloadedMaterial) {
        throw new NotFoundException('Material not found after update');
      }
      
      console.log('✅ Material saved and reloaded:', {
        id: reloadedMaterial.id,
        matCode: reloadedMaterial.matCode,
        matTypeId: reloadedMaterial.matTypeId,
        defaultLocationId: reloadedMaterial.defaultLocationId
      });

      // Update items name if provided
      if (dto.name || dto.description) {
        console.log('🔄 Updating items name with raw SQL...');
        
        const itemsUpdateFields: string[] = [];
        const itemsUpdateValues: any[] = [];
        
        if (dto.name !== undefined) {
          itemsUpdateFields.push(`name = $${itemsUpdateFields.length + 1}`);
          itemsUpdateValues.push(dto.name);
          console.log('📝 Will update items name to:', dto.name);
        }
        if (dto.description !== undefined) {
          itemsUpdateFields.push(`description = $${itemsUpdateFields.length + 1}`);
          itemsUpdateValues.push(dto.description);
          console.log('📝 Will update items description to:', dto.description);
        }
        
        itemsUpdateFields.push(`update_date = $${itemsUpdateFields.length + 1}`);
        itemsUpdateValues.push(new Date());
        itemsUpdateFields.push(`update_by = $${itemsUpdateFields.length + 1}`);
        itemsUpdateValues.push(dto.updateBy ?? 'system');
        
        if (itemsUpdateFields.length > 0) {
          const itemsSql = `UPDATE items_name SET ${itemsUpdateFields.join(', ')} WHERE material_id = $${itemsUpdateFields.length + 1}`;
          itemsUpdateValues.push(id);
          
          console.log('🔧 Executing Items SQL:', itemsSql);
          console.log('🔧 With values:', itemsUpdateValues);
          
          await manager.query(itemsSql, itemsUpdateValues);
          console.log('✅ Items name raw SQL update completed');
        }
      }

      return reloadedMaterial;
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    console.log('🗑️ Delete Material Service - Input:', { id });
    
    return await this.dataSource.transaction(async manager => {
      // Check if material exists
      const material = await manager.findOne(Material, { 
        where: { id },
        relations: ['materialsType', 'defaultLocation', 'itemsName', 'stock']
      });
      if (!material) throw new NotFoundException('Material not found');
      
      console.log('📋 Material to delete:', {
        id: material.id,
        matCode: material.matCode
      });

      // Delete items_name first (foreign key constraint)
      console.log('🗑️ Deleting items_name...');
      await manager.query('DELETE FROM items_name WHERE material_id = $1', [id]);
      console.log('✅ Items name deleted');

      // Delete materials_stock
      console.log('🗑️ Deleting materials_stock...');
      await manager.query('DELETE FROM materials_stock WHERE material_id = $1', [id]);
      console.log('✅ Materials stock deleted');

      // Delete material
      console.log('🗑️ Deleting material...');
      await manager.query('DELETE FROM materials WHERE id = $1', [id]);
      console.log('✅ Material deleted');
    });
  }

  // Materials Type CRUD
  async createMaterialsType(dto: CreateMaterialsTypeDto): Promise<MaterialsType> {
    const existing = await this.materialsTypeRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Type code already exists');

    const type = this.materialsTypeRepository.create(dto);
    return await this.materialsTypeRepository.save(type);
  }

  async findAllMaterialsTypes(): Promise<MaterialsType[]> {
    return await this.materialsTypeRepository.find();
  }

  // Materials Location CRUD
  async createMaterialsLocation(dto: CreateMaterialsLocationDto): Promise<MaterialsLocation> {
    const existing = await this.materialsLocationRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Location code already exists');

    const location = this.materialsLocationRepository.create(dto);
    return await this.materialsLocationRepository.save(location);
  }

  async findAllMaterialsLocations(): Promise<MaterialsLocation[]> {
    return await this.materialsLocationRepository.find();
  }

  // Items Name CRUD
  async createItemsName(dto: CreateItemsNameDto): Promise<ItemsName> {
    // Check if material exists
    const material = await this.materialRepository.findOne({ where: { id: dto.materialId } });
    if (!material) throw new NotFoundException('Material not found');

    // Check if items name already exists for this material
    const existing = await this.itemsNameRepository.findOne({ where: { materialId: dto.materialId } });
    if (existing) throw new ConflictException('Items name already exists for this material');

    const itemName = this.itemsNameRepository.create({
      ...dto,
      active: dto.active ?? true,
      createBy: dto.createBy ?? 'system'
    });
    return await this.itemsNameRepository.save(itemName);
  }

  // Stock Transaction methods
  async receiveStock(dto: StockTransactionDto): Promise<any> {
    console.log('📦 Receive Stock - Input:', dto);
    
    return await this.dataSource.transaction(async manager => {
      // Check if material exists
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
      if (!material) throw new NotFoundException('Material not found');
      
      // Get current stock
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (!stock) throw new NotFoundException('Stock record not found');
      
      console.log('📋 Current stock:', {
        totalQty: stock.totalQty,
        availableQty: stock.availableQty,
        reservedQty: stock.reservedQty
      });
      
      // Update stock using raw SQL
      const newTotalQty = stock.totalQty + dto.quantity;
      const newAvailableQty = stock.availableQty + dto.quantity;
      
      await manager.query(
        'UPDATE materials_stock SET total_qty = $1, available_qty = $2, update_date = $3 WHERE material_id = $4',
        [newTotalQty, newAvailableQty, new Date(), dto.materialId]
      );
      
      console.log('✅ Stock updated:', {
        received: dto.quantity,
        newTotalQty,
        newAvailableQty
      });
      
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
    console.log('📤 Issue Stock - Input:', dto);
    
    return await this.dataSource.transaction(async manager => {
      // Check if material exists
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
      if (!material) throw new NotFoundException('Material not found');
      
      // Get current stock
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (!stock) throw new NotFoundException('Stock record not found');
      
      console.log('📋 Current stock:', {
        totalQty: stock.totalQty,
        availableQty: stock.availableQty,
        reservedQty: stock.reservedQty
      });
      
      // Check if enough stock available
      if (stock.availableQty < dto.quantity) {
        throw new ConflictException(`Insufficient stock. Available: ${stock.availableQty}, Requested: ${dto.quantity}`);
      }
      
      // Update stock using raw SQL
      const newTotalQty = stock.totalQty - dto.quantity;
      const newAvailableQty = stock.availableQty - dto.quantity;
      
      await manager.query(
        'UPDATE materials_stock SET total_qty = $1, available_qty = $2, update_date = $3 WHERE material_id = $4',
        [newTotalQty, newAvailableQty, new Date(), dto.materialId]
      );
      
      console.log('✅ Stock updated:', {
        issued: dto.quantity,
        newTotalQty,
        newAvailableQty
      });
      
      return {
        materialId: dto.materialId,
        issuedQuantity: dto.quantity,
        newTotalQty,
        newAvailableQty,
        remark: dto.remark
      };
    });
  }

  // Supplier CRUD
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

  async findAllSuppliers(): Promise<Supplier[]> {
    return await this.supplierRepository.find({ where: { is_active: true } });
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
}
