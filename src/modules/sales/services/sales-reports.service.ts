import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { SalesOrder, OrderItem } from '../entities';

export interface SalesByCustomer {
  customerId: number;
  customerName: string;
  customerCode: string;
  totalOrders: number;
  totalSales: number;
}

export interface SalesByProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalSales: number;
}

export interface MonthlySales {
  year: number;
  month: number;
  monthName: string;
  totalOrders: number;
  totalSales: number;
}

@Injectable()
export class SalesReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
  ) {}

  async getSalesByCustomer(year?: number): Promise<SalesByCustomer[]> {
    const data = await this.orderRepo
      .createQueryBuilder('o')
      .select('c.id', 'customerId')
      .addSelect('c.name', 'customerName')
      .addSelect('c.code', 'customerCode')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .addSelect('SUM(o.grand_total)', 'totalSales')
      .innerJoin('o.customer', 'c')
      .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] });

    if (year) {
      data.andWhere("EXTRACT(YEAR FROM o.order_date) = :year", { year });
    }

    return data
      .groupBy('c.id, c.name, c.code')
      .orderBy('SUM(o.grand_total)', 'DESC')
      .getRawMany()
      .then((rows) =>
        rows.map((r) => ({
          customerId: parseInt(r.customerId),
          customerName: r.customerName,
          customerCode: r.customerCode,
          totalOrders: parseInt(r.totalOrders || '0'),
          totalSales: parseFloat(r.totalSales || '0'),
        })),
      );
  }

  async getSalesByProduct(year?: number): Promise<SalesByProduct[]> {
    const data = await this.itemRepo
      .createQueryBuilder('oi')
      .select('p.id', 'productId')
      .addSelect('p.product_code', 'productCode')
      .addSelect('p.product_name', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.line_total)', 'totalSales')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] });

    if (year) {
      data.andWhere("EXTRACT(YEAR FROM o.order_date) = :year", { year });
    }

    return data
      .groupBy('p.id, p.product_code, p.product_name')
      .orderBy('SUM(oi.line_total)', 'DESC')
      .getRawMany()
      .then((rows) =>
        rows.map((r) => ({
          productId: parseInt(r.productId),
          productCode: r.productCode,
          productName: r.productName,
          totalQuantity: parseFloat(r.totalQuantity || '0'),
          totalSales: parseFloat(r.totalSales || '0'),
        })),
      );
  }

  async getMonthlySales(year?: number): Promise<MonthlySales[]> {
    const targetYear = year || new Date().getFullYear();

    const data = await this.orderRepo
      .createQueryBuilder('o')
      .select("EXTRACT(YEAR FROM o.order_date)", 'year')
      .addSelect("EXTRACT(MONTH FROM o.order_date)", 'month')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .addSelect('SUM(o.grand_total)', 'totalSales')
      .where("EXTRACT(YEAR FROM o.order_date) = :year", { year: targetYear })
      .andWhere('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] })
      .groupBy("EXTRACT(YEAR FROM o.order_date), EXTRACT(MONTH FROM o.order_date)")
      .orderBy("EXTRACT(MONTH FROM o.order_date)", 'ASC')
      .getRawMany<{ year: string; month: string; totalOrders: string; totalSales: string }>();

    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];

    const result: MonthlySales[] = [];
    for (let i = 1; i <= 12; i++) {
      const found = data.find((d) => parseInt(d.month) === i);
      result.push({
        year: targetYear,
        month: i,
        monthName: monthNames[i - 1],
        totalOrders: found ? parseInt(found.totalOrders || '0') : 0,
        totalSales: found ? parseFloat(found.totalSales || '0') : 0,
      });
    }

    return result;
  }

  async getReportsSummary(year?: number) {
    const [salesByCustomer, salesByProduct, monthlySales] = await Promise.all([
      this.getSalesByCustomer(year),
      this.getSalesByProduct(year),
      this.getMonthlySales(year),
    ]);

    return ResponseHelper.success(
      {
        salesByCustomer,
        salesByProduct,
        monthlySales,
        year: year || new Date().getFullYear(),
      },
      'OK',
    );
  }
}
