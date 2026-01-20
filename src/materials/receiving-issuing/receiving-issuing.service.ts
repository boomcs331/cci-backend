import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialReceiving, MaterialReceivingLot, MaterialIssuing, MaterialIssuingLot, MaterialTransaction } from './receiving-issuing.entity';
import { Material, MaterialsStock } from '../entities';
import { CreateReceivingDto, CreateIssuingDto } from './receiving-issuing.dto';

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
    @InjectRepository(MaterialTransaction)
    private transactionRepository: Repository<MaterialTransaction>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(MaterialsStock)
    private stockRepository: Repository<MaterialsStock>,
    private dataSource: DataSource,
  ) {}

  async createReceiving(dto: CreateReceivingDto): Promise<MaterialReceiving> {
    return await this.dataSource.transaction(async manager => {
      // Validate material
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
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
        unit: material.unit,
        poNo: dto.poNo,
        remark: dto.remark,
        status: 'ACTIVE',
        createBy: dto.createBy ?? 'system'
      });
      const savedReceiving = await manager.save(receiving);

      // Create lots automatically
      const today = new Date();
      const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
      
      // Count existing lots for this material on this date
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const existingLotsCount = await manager
        .createQueryBuilder(MaterialReceivingLot, 'lot')
        .where('lot.materialId = :materialId', { materialId: dto.materialId })
        .andWhere('lot.createDate >= :startOfDay', { startOfDay })
        .andWhere('lot.createDate < :endOfDay', { endOfDay })
        .getCount();

      for (let i = 0; i < numberOfLots; i++) {
        const lotSeq = String(existingLotsCount + i + 1).padStart(3, '0');
        const lotNo = `LOT-${dto.materialId}-${dateStr}-${lotSeq}`;
        const qrCode = `QR-${lotNo}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const lotQuantity = i === numberOfLots - 1 ? lastLotQuantity : quantityPerLot;

        const lot = manager.create(MaterialReceivingLot, {
          receivingId: savedReceiving.id,
          lotNo,
          qrCode,
          materialId: dto.materialId,
          quantity: lotQuantity,
          remainingQuantity: lotQuantity,
          unit: material.unit,
          locationId: dto.locationId,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
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
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (stock) {
        stock.totalQty += dto.totalQuantity;
        stock.availableQty += dto.totalQuantity;
        await manager.save(stock);
      }

      return (await manager.findOne(MaterialReceiving, {
        where: { id: savedReceiving.id },
        relations: ['material', 'supplier', 'lots']
      }))!;
    });
  }

  async createIssuing(dto: CreateIssuingDto): Promise<MaterialIssuing> {
    return await this.dataSource.transaction(async manager => {
      // Validate material
      const material = await manager.findOne(Material, { where: { id: dto.materialId } });
      if (!material) throw new NotFoundException('Material not found');

      // Get available lots (FIFO)
      const availableLots = await manager
        .createQueryBuilder(MaterialReceivingLot, 'lot')
        .where('lot.materialId = :materialId', { materialId: dto.materialId })
        .andWhere('lot.status IN (:...statuses)', { statuses: ['AVAILABLE', 'PARTIAL_USED'] })
        .andWhere('lot.remainingQuantity > 0')
        .orderBy('lot.createDate', 'ASC')
        .addOrderBy('lot.id', 'ASC')
        .getMany();

      // Check if enough stock
      const totalAvailable = availableLots.reduce((sum, lot) => sum + Number(lot.remainingQuantity), 0);
      if (totalAvailable < dto.quantity) {
        throw new ConflictException(`Insufficient stock. Available: ${totalAvailable}, Requested: ${dto.quantity}`);
      }

      // Generate issuing number
      const count = await manager.count(MaterialIssuing);
      const issuingNo = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Create issuing header
      const issuing = manager.create(MaterialIssuing, {
        issuingNo,
        issuingDate: new Date(),
        materialId: dto.materialId,
        totalQuantity: dto.quantity,
        unit: material.unit,
        department: dto.department,
        workOrderNo: dto.workOrderNo,
        remark: dto.remark,
        status: 'COMPLETED',
        createBy: dto.createBy ?? 'system'
      });
      const savedIssuing = await manager.save(issuing);

      // Allocate from lots (FIFO)
      let remainingToIssue = dto.quantity;

      for (const lot of availableLots) {
        if (remainingToIssue <= 0) break;

        const issueFromThisLot = Math.min(Number(lot.remainingQuantity), remainingToIssue);

        // Create issuing lot record
        const issuingLot = manager.create(MaterialIssuingLot, {
          issuingId: savedIssuing.id,
          lotId: lot.id,
          qrCode: lot.qrCode,
          quantity: issueFromThisLot,
          unit: material.unit
        });
        await manager.save(issuingLot);

        // Update lot remaining quantity and status
        lot.remainingQuantity = Number(lot.remainingQuantity) - issueFromThisLot;
        if (lot.remainingQuantity === 0) {
          lot.status = 'USED_UP';
        } else {
          lot.status = 'PARTIAL_USED';
        }
        await manager.save(lot);

        // Create transaction log with unique transaction number
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
          remark: dto.remark,
          createBy: dto.createBy ?? 'system'
        });
        await manager.save(transaction);

        remainingToIssue -= issueFromThisLot;
      }

      // Update stock
      const stock = await manager.findOne(MaterialsStock, { where: { materialId: dto.materialId } });
      if (stock) {
        stock.totalQty -= dto.quantity;
        stock.availableQty -= dto.quantity;
        await manager.save(stock);
      }

      return (await manager.findOne(MaterialIssuing, {
        where: { id: savedIssuing.id },
        relations: ['material', 'lots', 'lots.lot']
      }))!;
    });
  }

  async getLotByQrCode(qrCode: string): Promise<any> {
    const lot = await this.receivingLotRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.receiving', 'receiving')
      .leftJoinAndSelect('lot.material', 'material')
      .leftJoinAndSelect('material.itemsName', 'itemsName')
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
      relations: ['material', 'material.itemsName'],
      order: { createDate: 'DESC' }
    });
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
      .leftJoinAndSelect('material.itemsName', 'itemsName')
      .leftJoinAndSelect('receiving.supplier', 'supplier')
      .leftJoinAndSelect('receiving.lots', 'lots');

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
        '(receiving.receivingNo ILIKE :search OR receiving.poNo ILIKE :search OR material.matCode ILIKE :search OR itemsName.name ILIKE :search OR supplier.name ILIKE :search)',
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
    status?: string
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
      .leftJoinAndSelect('material.itemsName', 'itemsName')
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

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(issuing.issuingNo ILIKE :search OR issuing.workOrderNo ILIKE :search OR material.matCode ILIKE :search OR itemsName.name ILIKE :search OR issuing.department ILIKE :search)',
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
}
