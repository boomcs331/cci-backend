import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Product,
  ProductBom,
  ProductLocation,
  Customer,
  ProductModel,
  ProductType,
  ProductDeliveryType,
  ProductUnit,
  ProductLoadingPoint,
  ProductProcessLine,
  ProductProductionStep,
} from './entities';
import { Material } from '../materials/entities/material.entity';
import { ProductStockService } from './product-stock.service';
import { ProductionProcess } from '../production-orders/entities/production-process.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductWithBomDto,
  CreateBomDto,
  ProductProductionStepItemDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBom)
    private bomRepo: Repository<ProductBom>,
    @InjectRepository(ProductLocation)
    private locationRepo: Repository<ProductLocation>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(ProductModel)
    private modelRepo: Repository<ProductModel>,
    @InjectRepository(ProductType)
    private typeRepo: Repository<ProductType>,
    @InjectRepository(ProductDeliveryType)
    private deliveryTypeRepo: Repository<ProductDeliveryType>,
    @InjectRepository(ProductUnit)
    private unitRepo: Repository<ProductUnit>,
    @InjectRepository(ProductLoadingPoint)
    private loadingPointRepo: Repository<ProductLoadingPoint>,
    @InjectRepository(ProductProcessLine)
    private processLineRepo: Repository<ProductProcessLine>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(ProductProductionStep)
    private productStepRepo: Repository<ProductProductionStep>,
    private dataSource: DataSource,
    private readonly productStockService: ProductStockService,
  ) {}

  private normalizeProcessCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '_');
  }

  /** WELDING -> Welding, PRESS_FIT -> Press Fit */
  private titleFromCode(normalizedCode: string): string {
    return normalizedCode
      .split('_')
      .map((w) => (w.length ? w[0] + w.slice(1).toLowerCase() : ''))
      .join(' ');
  }

  async findAllWithoutPagination() {
    return this.productRepo.find({
      where: { isActive: true },
      relations: ['boms', 'boms.material', 'boms.material.materialsType'],
      order: { id: 'ASC' },
    });
  }

  async findAllLocations() {
    return this.locationRepo.find({ order: { id: 'ASC' } });
  }

  async findAllCustomers() {
    return this.customerRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'id',
    sortOrder: string = 'ASC',
    isActive?: boolean,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.boms', 'boms')
      .leftJoinAndSelect('boms.material', 'material')
      .leftJoinAndSelect('material.materialsType', 'materialsType');

    if (isActive !== undefined) {
      queryBuilder.where('product.isActive = :isActive', { isActive });
    } else {
      queryBuilder.where('product.isActive = :isActive', { isActive: true });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.productCode ILIKE :search OR product.productName ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const validSortColumns = [
      'id',
      'productCode',
      'productName',
      'createDate',
      'updateDate',
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder.orderBy(`product.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: [
        'boms',
        'boms.material',
        'boms.material.materialsType',
        'productionSteps',
        'productionSteps.process',
      ],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByCode(code: string) {
    const product = await this.productRepo.findOne({
      where: { productCode: code },
      relations: [
        'boms',
        'boms.material',
        'boms.material.materialsType',
        'productionSteps',
        'productionSteps.process',
      ],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductWithBomDto, user: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🔍 Checking if product code exists:', dto.productCode);
      const exists = await this.productRepo.findOne({
        where: { productCode: dto.productCode },
      });
      if (exists) {
        console.log('❌ Product code already exists:', dto.productCode);
        throw new ConflictException('Product code already exists');
      }

      if (dto.customerId) {
        const customer = await this.customerRepo.findOne({
          where: { id: dto.customerId },
        });
        if (!customer)
          throw new NotFoundException(
            `Customer with id ${dto.customerId} not found`,
          );
      }

      if (dto.productTypeId) {
        const type = await this.typeRepo.findOne({
          where: { id: dto.productTypeId },
        });
        if (!type)
          throw new NotFoundException(
            `Product type with id ${dto.productTypeId} not found`,
          );
      }

      if (dto.defaultLocationId) {
        const location = await this.locationRepo.findOne({
          where: { id: dto.defaultLocationId },
        });
        if (!location)
          throw new NotFoundException(
            `Location with id ${dto.defaultLocationId} not found`,
          );
      }

      if (dto.modelId) {
        const model = await this.modelRepo.findOne({
          where: { id: dto.modelId },
        });
        if (!model)
          throw new NotFoundException(`Model with id ${dto.modelId} not found`);
      }

      if (dto.deliveryTypeId) {
        const deliveryType = await this.deliveryTypeRepo.findOne({
          where: { id: dto.deliveryTypeId },
        });
        if (!deliveryType)
          throw new NotFoundException(
            `Delivery type with id ${dto.deliveryTypeId} not found`,
          );
      }

      if (dto.unitId) {
        const unit = await this.unitRepo.findOne({ where: { id: dto.unitId } });
        if (!unit)
          throw new NotFoundException(`Unit with id ${dto.unitId} not found`);
      }

      if (dto.loadingPointId) {
        const loadingPoint = await this.loadingPointRepo.findOne({
          where: { id: dto.loadingPointId },
        });
        if (!loadingPoint)
          throw new NotFoundException(
            `Loading point with id ${dto.loadingPointId} not found`,
          );
      }

      if (dto.processLineId) {
        const processLine = await this.processLineRepo.findOne({
          where: { id: dto.processLineId },
        });
        if (!processLine)
          throw new NotFoundException(
            `Process line with id ${dto.processLineId} not found`,
          );
      }

      if (dto.bom && Array.isArray(dto.bom) && dto.bom.length > 0) {
        console.log(
          '🔍 Validating BOM materials...',
          JSON.stringify(dto.bom, null, 2),
        );
        for (const item of dto.bom) {
          console.log('Checking material ID:', item.materialId);
          const material = await this.materialRepo.findOne({
            where: { id: item.materialId },
          });
          if (!material)
            throw new NotFoundException(
              `Material with id ${item.materialId} not found`,
            );
          console.log('✅ Material found:', material.matCode);
        }
      }

      console.log('📝 Creating product entity with data:', {
        productCode: dto.productCode,
        productName: dto.productName,
        productTypeId: dto.productTypeId,
        defaultLocationId: dto.defaultLocationId,
      });

      const product = queryRunner.manager.create(Product, {
        productCode: dto.productCode,
        productName: dto.productName,
        description: dto.description,
        productTypeId: dto.productTypeId,
        defaultLocationId: dto.defaultLocationId,
        lr: dto.lr,
        lotSize: dto.lotSize,
        minStock: dto.minStock,
        customerId: dto.customerId,
        modelId: dto.modelId,
        deliveryTypeId: dto.deliveryTypeId,
        unitId: dto.unitId,
        scale: dto.scale,
        loadingPointId: dto.loadingPointId,
        processLineId: dto.processLineId,
        isActive: dto.isActive ?? true,
        createBy: user,
        updateBy: user,
      });

      console.log('💾 Saving product to database...');
      const saved = await queryRunner.manager.save(product);
      console.log('✅ Product saved with ID:', saved.id);

      await this.productStockService.ensureStockRow(queryRunner.manager, saved.id);

      if (dto.bom && Array.isArray(dto.bom) && dto.bom.length > 0) {
        console.log('📋 Adding BOM items:', dto.bom.length);
        console.log('BOM data:', JSON.stringify(dto.bom, null, 2));
        const boms = dto.bom.map((item) => {
          const bomItem = queryRunner.manager.create(ProductBom, {
            productId: saved.id,
            materialId: item.materialId,
            quantityPerUnit: item.quantityPerUnit,
            unit: item.unit,
            remarks: item.remarks,
            sequenceOrder: item.sequenceOrder,
            createBy: user,
            updateBy: user,
          });
          console.log('Created BOM item:', bomItem);
          return bomItem;
        });
        const savedBoms = await queryRunner.manager.save(ProductBom, boms);
        console.log('✅ BOM items saved:', savedBoms.length);
      }

      await queryRunner.commitTransaction();
      console.log('🔄 Fetching complete product data...');
      return this.findOne(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Transaction rolled back:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateProductDto, user: string) {
    const product = await this.findOne(id);
    Object.assign(product, dto, { updateBy: user });
    await this.productRepo.save(product);
    return this.findOne(id);
  }

  async delete(id: number) {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepo.save(product);
    return { message: 'Product deleted successfully' };
  }

  async getBom(productId: number) {
    const product = await this.findOne(productId);
    return product.boms;
  }

  async addBomItems(productId: number, items: CreateBomDto[], user: string) {
    const product = await this.findOne(productId);

    // Check for existing materials in BOM
    const existingMaterialIds = product.boms.map((bom) => bom.materialId);

    // Check for duplicates in request items
    const requestMaterialIds = items.map((item) => item.materialId);
    const duplicatesInRequest = requestMaterialIds.filter(
      (id, index) => requestMaterialIds.indexOf(id) !== index,
    );
    if (duplicatesInRequest.length > 0) {
      throw new ConflictException(
        `Duplicate materials in request: ${duplicatesInRequest.join(', ')}`,
      );
    }

    for (const item of items) {
      // Check if material already exists in BOM
      if (existingMaterialIds.includes(item.materialId)) {
        throw new ConflictException(
          `Material with id ${item.materialId} already exists in product BOM`,
        );
      }

      const material = await this.materialRepo.findOne({
        where: { id: item.materialId },
      });
      if (!material)
        throw new NotFoundException(
          `Material with id ${item.materialId} not found`,
        );
    }

    try {
      const boms = items.map((item) =>
        this.bomRepo.create({
          productId: product.id,
          materialId: item.materialId,
          quantityPerUnit: item.quantityPerUnit,
          unit: item.unit,
          remarks: item.remarks,
          sequenceOrder: item.sequenceOrder,
          createBy: user,
          updateBy: user,
        }),
      );
      return await this.bomRepo.save(boms);
    } catch (error) {
      // Handle database constraint errors
      if (error.code === '23505') {
        throw new ConflictException('Material already exists in product BOM');
      }
      throw error;
    }
  }

  async updateBom(productId: number, items: CreateBomDto[], user: string) {
    const product = await this.findOne(productId);

    // Check for duplicates in request items
    const requestMaterialIds = items.map((item) => item.materialId);
    const duplicatesInRequest = requestMaterialIds.filter(
      (id, index) => requestMaterialIds.indexOf(id) !== index,
    );
    if (duplicatesInRequest.length > 0) {
      throw new ConflictException(
        `Duplicate materials in request: ${duplicatesInRequest.join(', ')}`,
      );
    }

    for (const item of items) {
      const material = await this.materialRepo.findOne({
        where: { id: item.materialId },
      });
      if (!material)
        throw new NotFoundException(
          `Material with id ${item.materialId} not found`,
        );
    }

    try {
      await this.bomRepo.delete({ productId });

      const boms = items.map((item) =>
        this.bomRepo.create({
          productId: product.id,
          materialId: item.materialId,
          quantityPerUnit: item.quantityPerUnit,
          unit: item.unit,
          remarks: item.remarks,
          sequenceOrder: item.sequenceOrder,
          createBy: user,
          updateBy: user,
        }),
      );
      return await this.bomRepo.save(boms);
    } catch (error) {
      // Handle database constraint errors
      if (error.code === '23505') {
        throw new ConflictException('Duplicate materials in BOM');
      }
      throw error;
    }
  }

  async removeBomItem(bomId: number) {
    const bom = await this.bomRepo.findOne({ where: { id: bomId } });
    if (!bom) throw new NotFoundException('BOM item not found');
    await this.bomRepo.remove(bom);
    return { message: 'BOM item removed successfully' };
  }

  async getProductionSteps(productId: number) {
    await this.findOne(productId);
    return this.productStepRepo.find({
      where: { productId },
      relations: ['process'],
      order: { stepOrder: 'ASC' },
    });
  }

  /**
   * แทนที่ลำดับกระบวนการผลิตของสินค้าทั้งชุด (ต้องมี BOM อย่างน้อย 1 แถว ถ้ามีขั้นตอนมากกว่า 0)
   */
  async replaceProductionSteps(
    productId: number,
    steps: ProductProductionStepItemDto[],
    user: string,
  ) {
    await this.findOne(productId);
    const bomCount = await this.bomRepo.count({ where: { productId } });
    if (steps.length > 0 && bomCount === 0) {
      throw new BadRequestException(
        'กรุณากำหนด BOM สำหรับสินค้านี้ก่อนตั้งลำดับกระบวนการผลิต',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.delete(ProductProductionStep, { productId });

      for (let i = 0; i < steps.length; i++) {
        const raw = steps[i];
        const processCode = this.normalizeProcessCode(raw.processCode);
        const processName =
          raw.processName?.trim() || this.titleFromCode(processCode);

        let process = await manager.findOne(ProductionProcess, {
          where: { processCode },
        });
        if (!process) {
          const row = await manager
            .createQueryBuilder(ProductionProcess, 'p')
            .select('COALESCE(MAX(p.sequenceOrder), 0)', 'max')
            .getRawOne();
          const seq = Number(row?.max ?? 0) + 1;
          process = manager.create(ProductionProcess, {
            processCode,
            processName,
            sequenceOrder: seq,
            isActive: true,
          });
          process = await manager.save(process);
        }

        const link = manager.create(ProductProductionStep, {
          productId,
          stepOrder: i + 1,
          processId: process.id,
          createBy: user,
          updateBy: user,
        });
        await manager.save(link);
      }

      return manager.find(ProductProductionStep, {
        where: { productId },
        relations: ['process'],
        order: { stepOrder: 'ASC' },
      });
    });
  }

  async calculateMaterialRequirements(productId: number, quantity: number) {
    const product = await this.findOne(productId);
    return product.boms.map((bom) => ({
      materialId: bom.materialId,
      materialCode: bom.material.matCode,
      materialType: bom.material.materialsType.code,
      quantityPerUnit: bom.quantityPerUnit,
      requiredQuantity: Number(bom.quantityPerUnit) * quantity,
      unit: bom.unit,
    }));
  }
}
