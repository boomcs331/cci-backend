import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialReceiving, MaterialReceivingLot, MaterialIssuing, MaterialIssuingLot, MaterialTransaction, MaterialIssuingDocument } from './entities';
import { Material, MaterialsStock, IssuingType, MaterialIssue, MaterialIssueItem, MaterialIssueDocument } from '../entities';
import { Product } from '../../products/entities/product.entity';
import { ProductBom } from '../../products/entities/product-bom.entity';
import { CreateReceivingDto, CreateIssuingDto, CreateIssuingWithDocumentDto, CreateIssuingFromBomDto } from './dto';
import { CreateManualIssueDto, CreateProductionIssueDto, PreviewProductionIssueDto } from '../dto/material-issue.dto';

@Injectable()
export class ReceivingIssuingService {
  constructor(
    @InjectRepository(MaterialReceiving)
    private receivingRepository: Repository<MaterialReceiving>,
    @InjectRepository(MaterialReceivingLot)
    private receivingLotRepository: Repository<MaterialReceivingLot>,
    @InjectRepository(MaterialIssuing)
    private issuingRepository: Repository<MaterialIssuing>,
    @InjectRepository(MaterialIssuingLot)
    private issuingLotRepository: Repository<MaterialIssuingLot>,
    @InjectRepository(MaterialIssuingDocument)
    private issuingDocumentRepository: Repository<MaterialIssuingDocument>,
    @InjectRepository(MaterialTransaction)
    private transactionRepository: Repository<MaterialTransaction>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialsStock)
    private stockRepository: Repository<MaterialsStock>,
    @InjectRepository(IssuingType)
    private issuingTypeRepository: Repository<IssuingType>,
    @InjectRepository(MaterialIssue)
    private issueRepo: Repository<MaterialIssue>,
    @InjectRepository(MaterialIssueItem)
    private issueItemRepo: Repository<MaterialIssueItem>,
    @InjectRepository(MaterialIssueDocument)
    private issueDocumentRepo: Repository<MaterialIssueDocument>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBom)
    private bomRepo: Repository<ProductBom>,
    private dataSource: DataSource,
  ) {}

  async createReceiving(dto: CreateReceivingDto): Promise<MaterialReceiving> {
    return await this.dataSource.transaction(async manager => {
      // Validate material
      const material = await manager.findOne(Material, { 
        where: { id: dto.materialId },
        relations: ['unitMaster']
      });
      if (!material) throw new NotFoundException('Material not found');

      // Calculate number of lots based on lotSize
      const lotSize = material.lotSize || 1;
      const numberOfLots = Math.ceil(dto.totalQuantity / lotSize);
      const quantityPerLot = lotSize;
      const lastLotQuantity = dto.totalQuantity - (quantityPerLot * (numberOfLots - 1));

      // Generate receiving number
      const count = await manager.count(MaterialReceiving);
      const receivingNo = `RCV-${new Date().getFullYear()}-${String(count + 1).padStart(8, '0')}`;

      // Create receiving header
      const receiving = manager.create(MaterialReceiving, {
        receivingNo,
        receivingDate: new Date(),
        materialId: dto.materialId,
        supplierId: dto.supplierId,
        totalQuantity: dto.totalQuantity,
        unit: material.unitMaster?.code || 'PCS',
        poNo: dto.poNo,
        remark: dto.remark,
        status: 'ACTIVE',
        createBy: dto.createBy ?? 'system'
      });
      const savedReceiving = await manager.save(receiving);

      // Create lots automatically
      const today = new Date();
      const pcDateStr = today.getFullYear() + 
                        String(today.getMonth() + 1).padStart(2, '0') + 
                        String(today.getDate()).padStart(2, '0');
      
      // Use mfgDate for PD lot, fallback to today if not provided
      const pdDate = dto.mfgDate ? new Date(dto.mfgDate) : today;
      const pdDateStr = pdDate.getFullYear() + 
                        String(pdDate.getMonth() + 1).padStart(2, '0') + 
                        String(pdDate.getDate()).padStart(2, '0');
      
      // Count existing PC lots for today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const existingPcCount = await manager
        .createQueryBuilder(MaterialReceivingLot, 'lot')
        .where('lot.lotNo LIKE :prefix', { prefix: `PC${pcDateStr}-%` })
        .andWhere('lot.createDate >= :startOfDay', { startOfDay })
        .andWhere('lot.createDate < :endOfDay', { endOfDay })
        .getCount();

      // Count existing PD lots for mfgDate
      const pdStartOfDay = new Date(pdDate.getFullYear(), pdDate.getMonth(), pdDate.getDate());
      const pdEndOfDay = new Date(pdDate.getFullYear(), pdDate.getMonth(), pdDate.getDate() + 1);
      
      const existingPdCount = await manager
        .createQueryBuilder(MaterialReceivingLot, 'lot')
        .where('lot.lotPdNo LIKE :prefix', { prefix: `PD${pdDateStr}-%` })
        .andWhere('lot.incomeSupplireDate >= :pdStartOfDay', { pdStartOfDay })
        .andWhere('lot.incomeSupplireDate < :pdEndOfDay', { pdEndOfDay })
        .getCount();

      for (let i = 0; i < numberOfLots; i++) {
        const pcRunNo = String(existingPcCount + i + 1).padStart(3, '0');
        const pdRunNo = String(existingPdCount + i + 1).padStart(3, '0');
        const lotNo = `PC${pcDateStr}-${pcRunNo}`;
        const lotPdNo = `PD${pdDateStr}-${pdRunNo}`;
        const qrCode = `QR-${lotNo}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const lotQuantity = i === numberOfLots - 1 ? lastLotQuantity : quantityPerLot;

        const lot = manager.create(MaterialReceivingLot, {
          receivingId: savedReceiving.id,
          lotNo,
          lotPdNo,
          qrCode,
          materialId: dto.materialId,
          quantity: lotQuantity,
          remainingQuantity: lotQuantity,
          unit: material.unitMaster?.code || 'PCS',
          locationId: dto.locationId,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          incomeSupplireDate: dto.mfgDate ? new Date(dto.mfgDate) : undefined,
          status: 'AVAILABLE',
          createBy: dto.createBy ?? 'system'
        });
        await manager.save(lot);

        // Create transaction log with unique transaction number
        const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const transaction = manager.create(MaterialTransaction, {
          transactionNo: txnNo,
          transactionType: 'RECEIVE',
          transactionDate: new Date(),
          materialId: dto.materialId,
          lotId: lot.id,
          qrCode: lot.qrCode,
          quantity: lotQuantity,
          remainingQuantity: lotQuantity,
          referenceNo: receivingNo,
          remark: dto.remark,
          createBy: dto.createBy ?? 'system'
        });
        await manager.save(transaction);
      }

      // Update stock
      let stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (stock) {
        stock.totalQty += dto.totalQuantity;
        stock.availableQty += dto.totalQuantity;
        await manager.save(stock);
      } else {
        stock = manager.create(MaterialsStock, {
          materialId: dto.materialId,
          totalQty: dto.totalQuantity,
          availableQty: dto.totalQuantity,
          reservedQty: 0
        });
        await manager.save(stock);
      }

      return (await manager.findOne(MaterialReceiving, {
        where: { id: savedReceiving.id },
        relations: ['material', 'supplier', 'lots']
      }))!;
    });
  }

  async createIssuingWithDocument(dto: CreateIssuingWithDocumentDto): Promise<MaterialIssuing> {
    return await this.dataSource.transaction(async manager => {
      const material = await manager.findOne(Material, { 
        where: { id: dto.materialId },
        relations: ['unitMaster']
      });
      if (!material) throw new NotFoundException('Material not found');

      const issuingType = await manager.findOne(IssuingType, { where: { id: dto.issuingTypeId } });
      if (!issuingType) throw new NotFoundException('Issuing type not found');

      const availableLots = await manager
        .createQueryBuilder(MaterialReceivingLot, 'lot')
        .where('lot.materialId = :materialId', { materialId: dto.materialId })
        .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
        .andWhere('lot.remainingQuantity > 0')
        .orderBy('lot.createDate', 'ASC')
        .addOrderBy('lot.id', 'ASC')
        .getMany();

      const totalAvailable = availableLots.reduce((sum, lot) => sum + Number(lot.remainingQuantity), 0);
      if (totalAvailable < dto.quantity) {
        throw new ConflictException(`Insufficient stock. Available: ${totalAvailable}, Requested: ${dto.quantity}`);
      }

      const count = await manager.count(MaterialIssuing);
      const issuingNo = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const issuing = manager.create(MaterialIssuing, {
        issuingNo,
        issuingDate: new Date(),
        materialId: dto.materialId,
        issuingTypeId: dto.issuingTypeId,
        issuingType: issuingType.code,
        totalQuantity: dto.quantity,
        unit: material.unitMaster?.code || 'PCS',
        department: dto.department,
        workOrderNo: dto.workOrderNo,
        remark: dto.remark,
        status: 'COMPLETED',
        createBy: dto.createBy ?? 'system'
      });
      const savedIssuing = await manager.save(issuing);

      let remainingToIssue = dto.quantity;

      for (const lot of availableLots) {
        if (remainingToIssue <= 0) break;

        const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

        const issuingLot = manager.create(MaterialIssuingLot, {
          issuingId: savedIssuing.id,
          lotId: lot.id,
          qrCode: lot.qrCode,
          quantity: issueFromThisLot,
          unit: material.unitMaster?.code || 'PCS'
        });
        await manager.save(issuingLot);

        lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
        if (lot.remainingQuantity === 0) {
          lot.status = 'USED_UP';
        } else {
          lot.status = 'PARTIAL_USED';
        }
        await manager.save(lot);

        const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${lot.id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const transaction = manager.create(MaterialTransaction, {
          transactionNo: txnNo,
          transactionType: 'ISSUE',
          transactionDate: new Date(),
          materialId: dto.materialId,
          lotId: lot.id,
          qrCode: lot.qrCode,
          quantity: -issueFromThisLot,
          remainingQuantity: lot.remainingQuantity,
          referenceNo: issuingNo,
          remark: dto.remark || '',
          createBy: dto.createBy ?? 'system'
        });
        await manager.save(transaction);

        remainingToIssue -= issueFromThisLot;
      }

      if (dto.documents && dto.documents.length > 0) {
        for (const doc of dto.documents) {
          const document = manager.create(MaterialIssuingDocument, {
            issuingId: savedIssuing.id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            createBy: dto.createBy ?? 'system'
          });
          await manager.save(document);
        }
      }

      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (stock) {
        stock.totalQty -= dto.quantity;
        stock.availableQty -= dto.quantity;
        await manager.save(stock);
      }

      return (await manager.findOne(MaterialIssuing, {
        where: { id: savedIssuing.id },
        relations: ['material', 'issuingTypeMaster', 'lots', 'lots.lot', 'documents']
      }))!;
    });
  }

  async getLotByQrCode(qrCode: string): Promise<any> {
    const lot = await this.receivingLotRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.receiving', 'receiving')
      .leftJoinAndSelect('lot.material', 'material')
      .leftJoinAndSelect('lot.location', 'location')
      .leftJoinAndSelect('receiving.supplier', 'supplier')
      .where('lot.qrCode = :qrCode', { qrCode })
      .getOne();

    if (!lot) throw new NotFoundException('QR Code not found');

    return lot;
  }

  async getLotTransactions(qrCode: string): Promise<MaterialTransaction[]> {
    return await this.transactionRepository.find({
      where: { qrCode },
      relations: ['material'],
      order: { createDate: 'DESC' }
    });
  }

  async getAllLots(
    page: number = 1,
    limit: number = 10,
    materialId?: number,
    status?: string,
    locationId?: number
  ): Promise<{
    lots: MaterialReceivingLot[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.receivingLotRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.material', 'material')
      .leftJoinAndSelect('lot.location', 'location')
      .leftJoinAndSelect('lot.receiving', 'receiving')
      .leftJoinAndSelect('receiving.supplier', 'supplier');

    // Material filter
    if (materialId) {
      queryBuilder.where('lot.materialId = :materialId', { materialId });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('lot.status = :status', { status });
    } else {
      // Default: show only available and partial used
      queryBuilder.andWhere('lot.status IN (:...statuses)', { 
        statuses: ['AVAILABLE', 'PARTIAL_USED'] 
      });
    }

    // Location filter
    if (locationId) {
      queryBuilder.andWhere('lot.locationId = :locationId', { locationId });
    }

    // Only show lots with remaining quantity
    queryBuilder.andWhere('lot.remainingQuantity > 0');

    queryBuilder.orderBy('lot.createDate', 'ASC');

    const total = await queryBuilder.getCount();
    const lots = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      lots,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAllReceivings(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'id',
    sortOrder: string = 'DESC',
    materialId?: number,
    supplierId?: number,
    status?: string
  ): Promise<{
    receivings: MaterialReceiving[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.receivingRepository
      .createQueryBuilder('receiving')
      .leftJoinAndSelect('receiving.material', 'material')
      .leftJoinAndSelect('receiving.supplier', 'supplier')
      .leftJoinAndSelect('receiving.lots', 'lots')
      .addSelect(['lots.incomeSupplireDate']);

    // Status filter
    if (status) {
      queryBuilder.where('receiving.status = :status', { status });
    }

    // Material filter
    if (materialId) {
      queryBuilder.andWhere('receiving.materialId = :materialId', { materialId });
    }

    // Supplier filter
    if (supplierId) {
      queryBuilder.andWhere('receiving.supplierId = :supplierId', { supplierId });
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(receiving.receivingNo ILIKE :search OR receiving.poNo ILIKE :search OR material.matCode ILIKE :search OR material.matName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortColumns = ['id', 'receivingNo', 'receivingDate', 'totalQuantity', 'createDate'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`receiving.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const receivings = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      receivings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAllIssuings(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'id',
    sortOrder: string = 'DESC',
    materialId?: number,
    department?: string,
    status?: string,
    issuingType?: string
  ): Promise<{
    issuings: MaterialIssuing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.issuingRepository
      .createQueryBuilder('issuing')
      .leftJoinAndSelect('issuing.material', 'material')
      .leftJoinAndSelect('issuing.lots', 'lots')
      .leftJoinAndSelect('lots.lot', 'receivingLot');

    // Status filter
    if (status) {
      queryBuilder.where('issuing.status = :status', { status });
    }

    // Material filter
    if (materialId) {
      queryBuilder.andWhere('issuing.materialId = :materialId', { materialId });
    }

    // Department filter
    if (department) {
      queryBuilder.andWhere('issuing.department ILIKE :department', { department: `%${department}%` });
    }

    // Issuing type filter - removed (column doesn't exist)
    // if (issuingType) {
    //   queryBuilder.andWhere('issuing.issuingType = :issuingType', { issuingType });
    // }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(issuing.issuingNo ILIKE :search OR issuing.workOrderNo ILIKE :search OR material.matCode ILIKE :search OR material.matName ILIKE :search OR issuing.department ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortColumns = ['id', 'issuingNo', 'issuingDate', 'totalQuantity', 'createDate'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`issuing.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const issuings = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      issuings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAllIssuingTypes(): Promise<IssuingType[]> {
    return await this.issuingTypeRepository.find({ 
      where: { active: true },
      order: { code: 'ASC' }
    });
  }

  async getIssuingTypeById(id: number): Promise<IssuingType> {
    const issuingType = await this.issuingTypeRepository.findOne({ where: { id } });
    if (!issuingType) throw new NotFoundException('Issuing type not found');
    return issuingType;
  }

  async createIssuingFromBom(dto: CreateIssuingFromBomDto): Promise<MaterialIssuing[]> {
    return await this.dataSource.transaction(async manager => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        relations: ['boms', 'boms.material', 'boms.material.unitMaster']
      });
      if (!product) throw new NotFoundException('Product not found');
      if (!product.boms || product.boms.length === 0) {
        throw new NotFoundException('Product BOM not found');
      }

      const issuingType = await manager.findOne(IssuingType, { where: { id: dto.issuingTypeId } });
      if (!issuingType) throw new NotFoundException('Issuing type not found');

      // Create material_issue record
      const issueNo = await this.generateIssueNo();
      const issue = manager.create(MaterialIssue, {
        issueNo,
        issueDate: new Date(),
        issueType: 'PRODUCTION',
        productionOrderNo: dto.workOrderNo,
        productId: dto.productId,
        productionQuantity: dto.quantity,
        remarks: dto.remark,
        createBy: dto.createBy ?? 'system',
        updateBy: dto.createBy ?? 'system',
      });
      const savedIssue = await manager.save(issue);

      const issuings: MaterialIssuing[] = [];

      for (const bom of product.boms.filter(b => b.isActive)) {
        const requiredQty = Number(bom.quantityPerUnit) * dto.quantity;

        const availableLots = await manager
          .createQueryBuilder(MaterialReceivingLot, 'lot')
          .where('lot.materialId = :materialId', { materialId: bom.materialId })
          .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
          .andWhere('lot.remainingQuantity > 0')
          .orderBy('lot.createDate', 'ASC')
          .addOrderBy('lot.id', 'ASC')
          .getMany();

        const totalAvailable = availableLots.reduce((sum, lot) => sum + Number(lot.remainingQuantity), 0);
        if (totalAvailable < requiredQty) {
          throw new ConflictException(
            `Insufficient stock for material ${bom.material.matCode}. Available: ${totalAvailable}, Required: ${requiredQty}`
          );
        }

        const count = await manager.count(MaterialIssuing);
        const issuingNo = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const issuing = manager.create(MaterialIssuing, {
          issuingNo,
          issuingDate: new Date(),
          materialId: bom.materialId,
          issuingTypeId: dto.issuingTypeId,
          issuingType: issuingType.code,
          totalQuantity: requiredQty,
          unit: bom.material.unitMaster?.code || 'PCS',
          department: dto.department,
          workOrderNo: dto.workOrderNo,
          remark: dto.remark || `Product: ${product.productCode} x ${dto.quantity}`,
          status: 'COMPLETED',
          createBy: dto.createBy ?? 'system'
        });
        const savedIssuing = await manager.save(issuing);

        // Create material_issue_item record
        const issueItem = manager.create(MaterialIssueItem, {
          issueId: savedIssue.id,
          materialId: bom.materialId,
          quantityPerUnit: bom.quantityPerUnit,
          issuedQuantity: requiredQty,
          unit: bom.material.unitMaster?.code || 'PCS',
          createBy: dto.createBy ?? 'system',
        });
        await manager.save(issueItem);

        let remainingToIssue = requiredQty;

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

          const issuingLot = manager.create(MaterialIssuingLot, {
            issuingId: savedIssuing.id,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: issueFromThisLot,
            unit: bom.material.unitMaster?.code || 'PCS'
          });
          await manager.save(issuingLot);

          lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
          if (lot.remainingQuantity === 0) {
            lot.status = 'USED_UP';
          } else {
            lot.status = 'PARTIAL_USED';
          }
          await manager.save(lot);

          const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${lot.id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const transaction = manager.create(MaterialTransaction, {
            transactionNo: txnNo,
            transactionType: 'ISSUE',
            transactionDate: new Date(),
            materialId: bom.materialId,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: -issueFromThisLot,
            remainingQuantity: lot.remainingQuantity,
            referenceNo: issuingNo,
            remark: `Product: ${product.productCode} x ${dto.quantity}`,
            createBy: dto.createBy ?? 'system'
          });
          await manager.save(transaction);

          remainingToIssue -= issueFromThisLot;
        }

        if (dto.documents && dto.documents.length > 0) {
          for (const doc of dto.documents) {
            const document = manager.create(MaterialIssuingDocument, {
              issuingId: savedIssuing.id,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              createBy: dto.createBy ?? 'system'
            });
            await manager.save(document);
          }
        }

        const stock = await manager.findOne(MaterialsStock, { where: { materialId: bom.materialId } });
        if (stock) {
          stock.totalQty -= requiredQty;
          stock.availableQty -= requiredQty;
          await manager.save(stock);
        }

        issuings.push(savedIssuing);
      }

      return issuings;
    });
  }

  async createManualIssue(dto: CreateManualIssueDto, user: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of dto.items) {
        const material = await this.materialRepository.findOne({ where: { id: item.materialId } });
        if (!material) throw new NotFoundException(`Material with id ${item.materialId} not found`);

        const stock = await this.stockRepository.findOne({ where: { materialId: item.materialId } });
        if (!stock || stock.availableQty < item.quantity) {
          const available = stock?.availableQty || 0;
          throw new BadRequestException(
            `Insufficient stock for material ${material.matCode}. Available: ${available}, Requested: ${item.quantity}`
          );
        }
      }

      const issueNo = await this.generateIssueNo();
      const issue = queryRunner.manager.create(MaterialIssue, {
        issueNo,
        issueDate: new Date(dto.issueDate),
        issueType: 'MANUAL',
        documentNo: dto.documentNo,
        remarks: dto.remarks,
        createBy: user,
        updateBy: user,
      });

      const savedIssue = await queryRunner.manager.save(issue);

      const documents = dto.documentFiles || (dto.documentFile ? [{
        fileName: dto.documentFile.split('/').pop() || 'document',
        filePath: dto.documentFile,
        fileType: 'application/pdf',
        fileSize: 0
      }] : []);

      if (documents.length > 0) {
        for (const doc of documents) {
          const document = queryRunner.manager.create(MaterialIssueDocument, {
            issueId: savedIssue.id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            createBy: user,
          });
          await queryRunner.manager.save(document);
        }
      }

      for (const item of dto.items) {
        const issueItem = queryRunner.manager.create(MaterialIssueItem, {
          issueId: savedIssue.id,
          materialId: item.materialId,
          issuedQuantity: item.quantity,
          unit: item.unit,
          fromLocationId: item.fromLocationId,
          remarks: item.remarks,
          createBy: user,
        });
        await queryRunner.manager.save(issueItem);

        const material = await queryRunner.manager.findOne(Material, { 
          where: { id: item.materialId },
          relations: ['unitMaster']
        });

        const issuingCount = await queryRunner.manager.count(MaterialIssuing);
        const issuingNo = `ISS-${new Date().getFullYear()}-${String(issuingCount + 1).padStart(4, '0')}`;

        const issuing = queryRunner.manager.create(MaterialIssuing, {
          issuingNo,
          issuingDate: new Date(dto.issueDate),
          materialId: item.materialId,
          totalQuantity: item.quantity,
          unit: item.unit || material?.unitMaster?.code || 'PCS',
          department: 'MANUAL',
          remark: dto.remarks,
          status: 'COMPLETED',
          createBy: user
        });
        const savedIssuing = await queryRunner.manager.save(issuing);

        if (dto.documentFiles && dto.documentFiles.length > 0) {
          for (const doc of dto.documentFiles) {
            const issuingDoc = queryRunner.manager.create(MaterialIssuingDocument, {
              issuingId: savedIssuing.id,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              createBy: user,
            });
            await queryRunner.manager.save(issuingDoc);
          }
        }

        const availableLots = await queryRunner.manager
          .createQueryBuilder(MaterialReceivingLot, 'lot')
          .where('lot.materialId = :materialId', { materialId: item.materialId })
          .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
          .andWhere('lot.remainingQuantity > 0')
          .orderBy('lot.createDate', 'ASC')
          .addOrderBy('lot.id', 'ASC')
          .getMany();

        let remainingToIssue = item.quantity;

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

          const issuingLot = queryRunner.manager.create(MaterialIssuingLot, {
            issuingId: savedIssuing.id,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: issueFromThisLot,
            unit: item.unit || material?.unitMaster?.code || 'PCS'
          });
          await queryRunner.manager.save(issuingLot);

          lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
          if (lot.remainingQuantity === 0) {
            lot.status = 'USED_UP';
          } else {
            lot.status = 'PARTIAL_USED';
          }
          await queryRunner.manager.save(lot);

          const txnNo = `TXN-${new Date().getFullYear()}-${Date.now()}-${lot.id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const transaction = queryRunner.manager.create(MaterialTransaction, {
            transactionNo: txnNo,
            transactionType: 'ISSUE',
            transactionDate: new Date(dto.issueDate),
            materialId: item.materialId,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: -issueFromThisLot,
            remainingQuantity: lot.remainingQuantity,
            referenceNo: issuingNo,
            remark: dto.remarks || item.remarks || '',
            createBy: user
          });
          await queryRunner.manager.save(transaction);

          remainingToIssue -= issueFromThisLot;
        }

        const stock = await queryRunner.manager.findOne(MaterialsStock, { where: { materialId: item.materialId } });
        if (stock) {
          stock.totalQty -= item.quantity;
          stock.availableQty -= item.quantity;
          await queryRunner.manager.save(stock);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOneIssue(savedIssue.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createProductionIssue(dto: CreateProductionIssueDto, user: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
        relations: ['boms', 'boms.material'],
      });
      if (!product) throw new NotFoundException('Product not found');
      if (!product.boms || product.boms.length === 0) {
        throw new BadRequestException('Product has no BOM');
      }

      for (const bom of product.boms) {
        const requiredQty = Number(bom.quantityPerUnit) * dto.productionQuantity;
        const stock = await this.stockRepository.findOne({ where: { materialId: bom.materialId } });
        if (!stock || stock.availableQty < requiredQty) {
          const available = stock?.availableQty || 0;
          throw new BadRequestException(
            `Insufficient stock for material ${bom.material.matCode}. Available: ${available}, Required: ${requiredQty}`
          );
        }
      }

      const issueNo = await this.generateIssueNo();
      const issue = queryRunner.manager.create(MaterialIssue, {
        issueNo,
        issueDate: new Date(dto.issueDate),
        issueType: 'PRODUCTION',
        productionOrderNo: dto.productionOrderNo,
        productId: dto.productId,
        productionQuantity: dto.productionQuantity,
        remarks: dto.remarks,
        createBy: user,
        updateBy: user,
      });

      const savedIssue = await queryRunner.manager.save(issue);

      if (dto.documentFiles && dto.documentFiles.length > 0) {
        for (const doc of dto.documentFiles) {
          const document = queryRunner.manager.create(MaterialIssueDocument, {
            issueId: savedIssue.id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            createBy: user,
          });
          await queryRunner.manager.save(document);
        }
      }

      for (const bom of product.boms) {
        const issuedQty = Number(bom.quantityPerUnit) * dto.productionQuantity;
        const issueItem = queryRunner.manager.create(MaterialIssueItem, {
          issueId: savedIssue.id,
          materialId: bom.materialId,
          quantityPerUnit: bom.quantityPerUnit,
          issuedQuantity: issuedQty,
          unit: bom.unit,
          fromLocationId: dto.fromLocationId,
          createBy: user,
        });
        await queryRunner.manager.save(issueItem);

        const material = await queryRunner.manager.findOne(Material, { 
          where: { id: bom.materialId },
          relations: ['unitMaster']
        });

        const issuingCount = await queryRunner.manager.count(MaterialIssuing);
        const issuingNo = `ISS-${new Date().getFullYear()}-${String(issuingCount + 1).padStart(4, '0')}`;

        const issuing = queryRunner.manager.create(MaterialIssuing, {
          issuingNo,
          issuingDate: new Date(dto.issueDate),
          materialId: bom.materialId,
          totalQuantity: issuedQty,
          unit: bom.unit || material?.unitMaster?.code || 'PCS',
          department: 'PRODUCTION',
          workOrderNo: dto.productionOrderNo,
          remark: dto.remarks,
          status: 'COMPLETED',
          createBy: user
        });
        const savedIssuing = await queryRunner.manager.save(issuing);

        if (dto.documentFiles && dto.documentFiles.length > 0) {
          for (const doc of dto.documentFiles) {
            const issuingDoc = queryRunner.manager.create(MaterialIssuingDocument, {
              issuingId: savedIssuing.id,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              createBy: user,
            });
            await queryRunner.manager.save(issuingDoc);
          }
        }

        const availableLots = await queryRunner.manager
          .createQueryBuilder(MaterialReceivingLot, 'lot')
          .where('lot.materialId = :materialId', { materialId: bom.materialId })
          .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
          .andWhere('lot.remainingQuantity > 0')
          .orderBy('lot.createDate', 'ASC')
          .addOrderBy('lot.id', 'ASC')
          .getMany();

        let remainingToIssue = issuedQty;

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

          const issuingLot = queryRunner.manager.create(MaterialIssuingLot, {
            issuingId: savedIssuing.id,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: issueFromThisLot,
            unit: bom.unit || material?.unitMaster?.code || 'PCS'
          });
          await queryRunner.manager.save(issuingLot);

          lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
          if (lot.remainingQuantity === 0) {
            lot.status = 'USED_UP';
          } else {
            lot.status = 'PARTIAL_USED';
          }
          await queryRunner.manager.save(lot);

          remainingToIssue -= issueFromThisLot;
        }

        await queryRunner.manager.decrement(
          MaterialsStock,
          { materialId: bom.materialId },
          'availableQty',
          issuedQty
        );
      }

      await queryRunner.commitTransaction();
      return this.findOneIssue(savedIssue.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async previewProductionIssue(dto: PreviewProductionIssueDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['boms', 'boms.material'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.boms || product.boms.length === 0) {
      throw new BadRequestException('Product has no BOM');
    }

    const requiredMaterials = await Promise.all(
      product.boms.map(async (bom) => {
        const requiredQty = Number(bom.quantityPerUnit) * dto.productionQuantity;
        const stock = await this.stockRepository.findOne({ where: { materialId: bom.materialId } });
        
        return {
          materialId: bom.materialId,
          materialCode: bom.material.matCode,
          materialName: bom.material.matName,
          quantityPerUnit: bom.quantityPerUnit,
          requiredQuantity: requiredQty,
          unit: bom.unit,
          currentStock: stock?.availableQty || 0,
          isAvailable: stock && stock.availableQty >= requiredQty,
        };
      })
    );

    return {
      productId: product.id,
      productCode: product.productCode,
      productName: product.productName,
      productionQuantity: dto.productionQuantity,
      requiredMaterials,
    };
  }

  async findAllIssues(page = 1, limit = 10, issueType?: string, startDate?: string, endDate?: string) {
    const query = this.issueRepo.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.items', 'items')
      .leftJoinAndSelect('items.material', 'material')
      .leftJoinAndSelect('issue.product', 'product')
      .leftJoinAndSelect('issue.documents', 'documents')
      .where('issue.isActive = :isActive', { isActive: true });

    if (issueType) query.andWhere('issue.issueType = :issueType', { issueType });
    if (startDate) query.andWhere('issue.issueDate >= :startDate', { startDate });
    if (endDate) query.andWhere('issue.issueDate <= :endDate', { endDate });

    query.orderBy('issue.issueDate', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneIssue(id: number) {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: ['items', 'items.material', 'product', 'documents'],
    });
    if (!issue) throw new NotFoundException('Material issue not found');
    return issue;
  }

  async getIssueDocuments(id: number) {
    const issue = await this.issueRepo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('Material issue not found');
    return this.issueDocumentRepo.find({ where: { issueId: id }, order: { createDate: 'ASC' } });
  }

  private async generateIssueNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `ISS-${year}${month}`;
    
    const lastIssue = await this.issueRepo.findOne({
      where: {},
      order: { id: 'DESC' },
    });

    let sequence = 1;
    if (lastIssue && lastIssue.issueNo.startsWith(prefix)) {
      const lastSeq = parseInt(lastIssue.issueNo.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  async getMaterialsStock(page: number, limit: number, materialId?: number) {
    const query = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.material', 'material')
      .leftJoinAndSelect('material.unitMaster', 'unit');

    if (materialId) {
      query.where('stock.materialId = :materialId', { materialId });
    }

    query.orderBy('stock.materialId', 'ASC');

    const [stocks, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { stocks, total, page, limit };
  }

  async getMaterialStock(materialId: number) {
    const stock = await this.stockRepository.findOne({
      where: { materialId },
      relations: ['material', 'material.unitMaster']
    });
    if (!stock) throw new NotFoundException('Material stock not found');
    return stock;
  }

  async getTransactionReport(startDate?: string, endDate?: string, materialId?: number) {
    const query = this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.material', 'material')
      .leftJoinAndSelect('txn.lot', 'lot')
      .orderBy('txn.transactionDate', 'ASC');

    if (startDate) query.andWhere('txn.transactionDate >= :startDate', { startDate });
    if (endDate) query.andWhere('txn.transactionDate <= :endDate', { endDate });
    if (materialId) query.andWhere('txn.materialId = :materialId', { materialId });

    const transactions = await query.getMany();

    const grouped = transactions.reduce((acc: any, txn) => {
      const date = new Date(txn.transactionDate).toISOString().split('T')[0];
      const key = `${txn.materialId}-${date}`;
      const qty = Number(txn.quantity);
      
      if (!acc[key]) {
        acc[key] = {
          materialId: txn.materialId,
          materialCode: txn.material?.matCode,
          materialName: txn.material?.matName,
          transactionDate: date,
          received: 0,
          issued: 0,
          balance: 0,
        };
      }
      
      if (qty > 0) {
        acc[key].received += qty;
      } else {
        acc[key].issued += Math.abs(qty);
      }
      acc[key].balance = acc[key].received - acc[key].issued;
      
      return acc;
    }, {});

    return Object.values(grouped);
  }

  async createIssuingFromMaterialBom(dto: any, user: string) {
    return await this.dataSource.transaction(async manager => {
      const material: any = await manager.findOne(Material, {
        where: { id: dto.materialId },
        relations: ['boms', 'boms.childMaterial', 'boms.childMaterial.unitMaster']
      });
      if (!material) throw new NotFoundException('Material not found');
      if (!material.boms || material.boms.length === 0) {
        throw new NotFoundException('Material BOM not found');
      }

      const issuings: MaterialIssuing[] = [];

      for (const bom of material.boms.filter((b: any) => b.isActive)) {
        const requiredQty = Number(bom.quantity) * dto.quantity;

        const availableLots = await manager
          .createQueryBuilder(MaterialReceivingLot, 'lot')
          .where('lot.materialId = :materialId', { materialId: bom.childMaterialId })
          .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
          .andWhere('lot.remainingQuantity > 0')
          .orderBy('lot.createDate', 'ASC')
          .addOrderBy('lot.id', 'ASC')
          .getMany();

        const totalAvailable = availableLots.reduce((sum, lot) => sum + Number(lot.remainingQuantity), 0);
        if (totalAvailable < requiredQty) {
          throw new ConflictException(
            `Insufficient stock for material ${bom.childMaterial.matCode}. Available: ${totalAvailable}, Required: ${requiredQty}`
          );
        }

        const count = await manager.count(MaterialIssuing);
        const issuingNo = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const issuing = manager.create(MaterialIssuing, {
          issuingNo,
          issuingDate: new Date(),
          materialId: bom.childMaterialId,
          totalQuantity: requiredQty,
          unit: bom.childMaterial.unitMaster?.code || 'PCS',
          department: dto.department || 'PRODUCTION',
          workOrderNo: dto.workOrderNo,
          remark: dto.remark || `Material: ${material.matCode} x ${dto.quantity}`,
          status: 'COMPLETED',
          createBy: user
        });
        const savedIssuing = await manager.save(issuing);

        let remainingToIssue = requiredQty;

        for (const lot of availableLots) {
          if (remainingToIssue <= 0) break;

          const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

          const issuingLot = manager.create(MaterialIssuingLot, {
            issuingId: savedIssuing.id,
            lotId: lot.id,
            qrCode: lot.qrCode,
            quantity: issueFromThisLot,
            unit: bom.childMaterial.unitMaster?.code || 'PCS'
          });
          await manager.save(issuingLot);

          lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
          if (lot.remainingQuantity === 0) {
            lot.status = 'USED_UP';
          } else {
            lot.status = 'PARTIAL_USED';
          }
          await manager.save(lot);

          remainingToIssue -= issueFromThisLot;
        }

        if (dto.documentFiles && dto.documentFiles.length > 0) {
          for (const doc of dto.documentFiles) {
            const document = manager.create(MaterialIssuingDocument, {
              issuingId: savedIssuing.id,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              createBy: user
            });
            await manager.save(document);
          }
        }

        const stock = await manager.findOne(MaterialsStock, { where: { materialId: bom.childMaterialId } });
        if (stock) {
          stock.totalQty -= requiredQty;
          stock.availableQty -= requiredQty;
          await manager.save(stock);
        }

        issuings.push(savedIssuing);
      }

      return issuings;
    });
  }
}