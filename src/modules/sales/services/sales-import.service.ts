import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { Customer } from '../products/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { ImportBatch, ImportRow, type ImportBatchStatus, type ImportRowStatus } from './entities';
import { ImportRowDto } from './dto/import-row.dto';
import { SalesOrdersService } from './sales-orders.service';
import * as xlsx from 'xlsx';

@Injectable()
export class SalesImportService {
  constructor(
    @InjectRepository(ImportBatch)
    private readonly batchRepo: Repository<ImportBatch>,
    @InjectRepository(ImportRow)
    private readonly rowRepo: Repository<ImportRow>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly ordersService: SalesOrdersService,
    private readonly dataSource: DataSource,
  ) {}

  private generateBatchCode(): string {
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `IMP-${yyyymmdd}-${random}`;
  }

  /** Parse Excel file and return rows */
  async parseExcel(file: Express.Multer.File): Promise<ImportRowDto[]> {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    if (!data || data.length === 0) {
      throw new BadRequestException('ไฟล์ Excel ไม่มีข้อมูล');
    }

    return data.map((row: any) => ({
      orderGroup: row['order_group'] || null,
      customerCode: row['customer_code'],
      productCode: row['product_code'],
      quantity: parseFloat(row['quantity']) || 0,
      unitPrice: parseFloat(row['unit_price']) || 0,
      discount: parseFloat(row['discount']) || 0,
      requiredDate: row['required_date'] || null,
      deliveryDate: row['delivery_date'] || null,
      salesChannel: row['sales_channel'] || null,
      note: row['note'] || null,
    }));
  }

  /** Validate rows and save to import_rows */
  async validateAndSave(
    rows: ImportRowDto[],
    fileName: string,
    userId: number,
  ): Promise<ImportBatch> {
    const batchCode = this.generateBatchCode();
    const batch = this.batchRepo.create({
      batchCode,
      fileName,
      uploadedBy: userId,
      status: 'PENDING',
      totalRows: rows.length,
      validRows: 0,
      errorRows: 0,
      committedRows: 0,
    });

    const savedBatch = await this.batchRepo.save(batch);

    const importRows: ImportRow[] = [];
    const errorSummary: Record<string, number> = {};

    for (let i = 0; i < rows.length; i++) {
      const rowDto = rows[i];
      const rowNumber = i + 2; // Excel row number (header is row 1)

      const validationResult = await this.validateRow(rowDto);
      
      const row = this.rowRepo.create({
        batchId: savedBatch.id,
        rowNumber,
        status: validationResult.isValid ? 'VALID' : 'ERROR',
        orderGroup: rowDto.orderGroup || null,
        customerCode: rowDto.customerCode,
        productCode: rowDto.productCode,
        quantity: rowDto.quantity?.toString() || null,
        unitPrice: rowDto.unitPrice?.toString() || null,
        discount: rowDto.discount?.toString() || null,
        requiredDate: rowDto.requiredDate ? new Date(rowDto.requiredDate) : null,
        deliveryDate: rowDto.deliveryDate ? new Date(rowDto.deliveryDate) : null,
        salesChannel: rowDto.salesChannel || null,
        note: rowDto.note || null,
        errorCode: validationResult.errorCode || null,
        errorMessage: validationResult.errorMessage || null,
      });

      importRows.push(row);

      if (validationResult.isValid) {
        savedBatch.validRows++;
      } else {
        savedBatch.errorRows++;
        if (validationResult.errorCode) {
          errorSummary[validationResult.errorCode] = (errorSummary[validationResult.errorCode] || 0) + 1;
        }
      }
    }

    savedBatch.errorSummary = errorSummary;
    savedBatch.status = 'VALIDATED';
    await this.batchRepo.save(savedBatch);
    await this.rowRepo.save(importRows);

    return savedBatch;
  }

  private async validateRow(row: ImportRowDto): Promise<{
    isValid: boolean;
    errorCode?: string;
    errorMessage?: string;
  }> {
    // Check customer
    const customer = await this.customerRepo.findOne({
      where: { code: row.customerCode },
    });
    if (!customer) {
      return { isValid: false, errorCode: 'CUSTOMER_NOT_FOUND', errorMessage: 'ไม่พบรหัสลูกค้า' };
    }

    // Check product
    const product = await this.productRepo.findOne({
      where: { productCode: row.productCode },
    });
    if (!product) {
      return { isValid: false, errorCode: 'PRODUCT_NOT_FOUND', errorMessage: 'ไม่พบรหัสสินค้า' };
    }

    // Check quantity
    if (!row.quantity || row.quantity <= 0) {
      return { isValid: false, errorCode: 'INVALID_QUANTITY', errorMessage: 'จำนวนต้องมากกว่า 0' };
    }

    // Check unit price
    if (row.unitPrice !== undefined && row.unitPrice < 0) {
      return { isValid: false, errorCode: 'INVALID_PRICE', errorMessage: 'ราคาต้องไม่ติดลบ' };
    }

    // Check discount
    if (row.discount !== undefined && row.discount < 0) {
      return { isValid: false, errorCode: 'INVALID_DISCOUNT', errorMessage: 'ส่วนลดต้องไม่ติดลบ' };
    }

    const gross = row.quantity * (row.unitPrice || 0);
    if ((row.discount || 0) > gross) {
      return { isValid: false, errorCode: 'INVALID_DISCOUNT', errorMessage: 'ส่วนลดมากกว่ามูลค่าสินค้า' };
    }

    // Check dates
    const today = new Date().toISOString().slice(0, 10);
    if (row.requiredDate && row.requiredDate < today) {
      return { isValid: false, errorCode: 'INVALID_DATE', errorMessage: 'วันที่ต้องการต้องไม่น้อยกว่าวันนี้' };
    }

    if (row.deliveryDate && row.requiredDate && row.deliveryDate < row.requiredDate) {
      return { isValid: false, errorCode: 'INVALID_DATE', errorMessage: 'วันที่ส่งต้องไม่น้อยกว่าวันที่ต้องการ' };
    }

    // TODO: Check stock availability
    // TODO: Check customer credit limit

    return { isValid: true };
  }

  /** Get batch details with rows */
  async getBatch(batchId: string): Promise<ImportBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: ['rows'],
    });
    if (!batch) {
      throw new NotFoundException('ไม่พบ batch');
    }
    return batch;
  }

  /** List batches */
  async listBatches(query: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));

    const qb = this.batchRepo.createQueryBuilder('batch');

    if (query.status) {
      qb.andWhere('batch.status = :status', { status: query.status });
    }

    qb.orderBy('batch.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return ResponseHelper.success(
      {
        items: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      'OK',
    );
  }

  /** Commit valid rows to create orders */
  async commitBatch(batchId: string, username: string) {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: ['rows'],
    });

    if (!batch) {
      throw new NotFoundException('ไม่พบ batch');
    }

    if (batch.status !== 'VALIDATED') {
      throw new BadRequestException('Batch ต้องอยู่ในสถานะ VALIDATED เท่านั้น');
    }

    if (batch.validRows === 0) {
      throw new BadRequestException('ไม่มีรายการที่ถูกต้องสำหรับ import');
    }

    const validRows = batch.rows.filter((r) => r.status === 'VALID');
    const ordersByCustomer = new Map<number, ImportRow[]>();

    // Group rows by customer
    for (const row of validRows) {
      const customer = await this.customerRepo.findOne({
        where: { code: row.customerCode! },
      });
      if (customer) {
        if (!ordersByCustomer.has(customer.id)) {
          ordersByCustomer.set(customer.id, []);
        }
        ordersByCustomer.get(customer.id)!.push(row);
      }
    }

    let committedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const [customerId, rows] of ordersByCustomer.entries()) {
        const items = rows.map(async (row) => {
          const product = await this.productRepo.findOne({
            where: { productCode: row.productCode! },
          });
          return {
            productId: product!.id,
            quantity: parseFloat(row.quantity!),
            unitPrice: parseFloat(row.unitPrice || '0'),
            discount: parseFloat(row.discount || '0'),
          };
        });
        const resolvedItems = await Promise.all(items);

        const orderDto = {
          customerId,
          salesChannel: rows[0].salesChannel || undefined,
          orderDate: new Date().toISOString().slice(0, 10),
          requiredDate: rows[0].requiredDate?.toISOString().slice(0, 10) || undefined,
          deliveryDate: rows[0].deliveryDate?.toISOString().slice(0, 10) || undefined,
          note: rows[0].note || undefined,
          status: 'PENDING' as const,
          items: resolvedItems,
        };

        try {
          const result = await this.ordersService.create(orderDto, username);
          const orderId = result.data?.id;

          // Update rows with order ID
          for (const row of rows) {
            row.orderId = orderId || null;
            row.status = 'COMMITTED';
            await manager.save(row);
          }

          committedCount += rows.length;
        } catch (error) {
          // Log error but continue with other orders
          console.error(`Failed to create order for customer ${customerId}:`, error);
        }
      }

      // Update batch status
      batch.status = 'COMMITTED';
      batch.committedRows = committedCount;
      batch.committedAt = new Date();
      await manager.save(batch);
    });

    return ResponseHelper.success(
      {
        batchId: batch.id,
        committedRows: committedCount,
        totalRows: batch.totalRows,
      },
      'Import สำเร็จ',
    );
  }

  /** Download Excel template */
  getTemplateBuffer(): Buffer {
    const template = [
      {
        order_group: 'GROUP001',
        customer_code: 'C001',
        product_code: 'P001',
        quantity: 10,
        unit_price: 100,
        discount: 0,
        required_date: '2026-06-01',
        delivery_date: '2026-06-05',
        sales_channel: 'ONLINE',
        note: 'หมายเหตุ',
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
