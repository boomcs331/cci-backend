import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../products/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { TransformedRow, TransformResult } from '../interfaces/transform-result.interface';

@Injectable()
export class PlanningTransformService {
  private customerCache = new Map<string, Customer | null>();
  private productCache = new Map<string, Product | null>();

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async transformBatch(
    rows: any[],
    batchId: number,
    year: number,
    month: number,
  ): Promise<TransformResult> {
    const transformedRows: TransformedRow[] = [];
    let skippedRows = 0;
    const daysInMonth = this.getDaysInMonth(year, month);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const rowTransformed = await this.transformRow(
        row,
        batchId,
        year,
        month,
        rowNumber,
        daysInMonth,
      );

      transformedRows.push(...rowTransformed);
      skippedRows += rowTransformed.length === 0 ? 1 : 0;
    }

    return {
      transformedRows,
      totalRows: rows.length,
      skippedRows,
    };
  }

  async transformRow(
    row: any,
    batchId: number,
    year: number,
    month: number,
    rowNumber: number,
    daysInMonth: number,
  ): Promise<TransformedRow[]> {
    const transformedRows: TransformedRow[] = [];
    const customerCode = row['Customer']?.trim();
    const productCode = row['Part No']?.trim();
    const model = row['Model']?.trim() || null;

    // Look up customer ID (with caching)
    const customer = await this.getCustomer(customerCode);
    const customerId = customer?.id || null;

    // Look up product ID (with caching)
    const product = await this.getProduct(productCode);
    const productId = product?.id || null;

    // Transform each day
    for (let day = 1; day <= daysInMonth; day++) {
      const dayValue = row[day.toString()];
      const quantity = parseFloat(dayValue) || 0;

      // Only create record if quantity > 0
      if (quantity > 0) {
        const saleDate = new Date(year, month - 1, day);

        transformedRows.push({
          batchId,
          customerCode,
          customerId,
          productCode,
          productId,
          model,
          saleDate,
          quantity,
          originalRowNumber: rowNumber,
          status: 'VALID',
        });
      }
    }

    return transformedRows;
  }

  private async getCustomer(customerCode: string): Promise<Customer | null> {
    if (!customerCode) return null;

    // Check cache first
    if (this.customerCache.has(customerCode)) {
      return this.customerCache.get(customerCode) || null;
    }

    // Look up in database
    const customer = await this.customerRepository.findOne({
      where: { code: customerCode },
    });

    // Cache the result (including null for not found)
    this.customerCache.set(customerCode, customer || null);

    return customer;
  }

  private async getProduct(productCode: string): Promise<Product | null> {
    if (!productCode) return null;

    // Check cache first
    if (this.productCache.has(productCode)) {
      return this.productCache.get(productCode) || null;
    }

    // Look up in database
    const product = await this.productRepository.findOne({
      where: { productCode },
    });

    // Cache the result (including null for not found)
    this.productCache.set(productCode, product || null);

    return product;
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  clearCache(): void {
    this.customerCache.clear();
    this.productCache.clear();
  }

  getCacheStats(): {
    customerCacheSize: number;
    productCacheSize: number;
  } {
    return {
      customerCacheSize: this.customerCache.size,
      productCacheSize: this.productCache.size,
    };
  }
}
