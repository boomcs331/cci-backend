import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { SalesOrder } from '../entities/order.entity';

export interface DashboardKPI {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  thisMonthSales: number;
  thisMonthOrders: number;
}

export interface SalesChartPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalSales: number;
}

export interface UpcomingDelivery {
  orderId: string;
  orderNo: string;
  customerName: string;
  deliveryDate: string;
  grandTotal: number;
  status: string;
}

@Injectable()
export class SalesDashboardService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
  ) {}

  async getKPI(): Promise<DashboardKPI> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10);

    const [
      totalOrders,
      pendingOrders,
      approvedOrders,
      completedOrders,
      cancelledOrders,
      totalSales,
      thisMonthData,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: 'PENDING' } }),
      this.orderRepo.count({ where: { status: 'APPROVED' } }),
      this.orderRepo.count({ where: { status: 'COMPLETED' } }),
      this.orderRepo.count({ where: { status: 'CANCELLED' } }),
      this.orderRepo
        .createQueryBuilder('o')
        .select('SUM(o.grandTotal)', 'total')
        .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] })
        .getRawOne<{ total: string }>()
        .then((r) => parseFloat(r?.total || '0')),
      this.orderRepo
        .createQueryBuilder('o')
        .select('COUNT(o.id)', 'count')
        .addSelect('SUM(o.grandTotal)', 'total')
        .where('o.orderDate >= :date', { date: firstDayOfMonthStr })
        .andWhere('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] })
        .getRawOne<{ count: string; total: string }>()
        .then((r) => ({
          orders: parseInt(r?.count || '0'),
          sales: parseFloat(r?.total || '0'),
        })),
    ]);

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      completedOrders,
      cancelledOrders,
      totalSales,
      thisMonthSales: thisMonthData.sales,
      thisMonthOrders: thisMonthData.orders,
    };
  }

  async getSalesChart(days: number = 30): Promise<SalesChartPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE(o.orderDate)", 'date')
      .addSelect('COUNT(o.id)', 'orders')
      .addSelect('SUM(o.grandTotal)', 'sales')
      .where('o.orderDate >= :startDate', { startDate: startDate.toISOString().slice(0, 10) })
      .where('o.orderDate <= :endDate', { endDate: endDate.toISOString().slice(0, 10) })
      .andWhere('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] })
      .groupBy("DATE(o.orderDate)")
      .orderBy("DATE(o.orderDate)", 'ASC')
      .getRawMany<{ date: string; orders: string; sales: string }>();

    return data.map((d) => ({
      date: d.date,
      orders: parseInt(d.orders || '0'),
      sales: parseFloat(d.sales || '0'),
    }));
  }

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const data = await this.orderRepo
      .createQueryBuilder('o')
      .select('p.id', 'productId')
      .addSelect('p.product_code', 'productCode')
      .addSelect('p.product_name', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.line_total)', 'totalSales')
      .innerJoin('o.items', 'oi')
      .innerJoin('oi.product', 'p')
      .where('o.status IN (:...statuses)', { statuses: ['COMPLETED', 'SHIPPING'] })
      .groupBy('p.id, p.product_code, p.product_name')
      .orderBy('SUM(oi.line_total)', 'DESC')
      .limit(limit)
      .getRawMany();

    return data.map((d) => ({
      productId: parseInt(d.productId),
      productCode: d.product_code,
      productName: d.product_name,
      totalQuantity: parseFloat(d.totalQuantity || '0'),
      totalSales: parseFloat(d.totalSales || '0'),
    }));
  }

  async getUpcomingDeliveries(days: number = 7): Promise<UpcomingDelivery[]> {
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().slice(0, 10);

    const data = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.id', 'orderId')
      .addSelect('o.order_no', 'orderNo')
      .addSelect('c.name', 'customerName')
      .addSelect('o.delivery_date', 'deliveryDate')
      .addSelect('o.grand_total', 'grandTotal')
      .addSelect('o.status', 'status')
      .innerJoin('o.customer', 'c')
      .where('o.delivery_date >= :today', { today })
      .where('o.delivery_date <= :futureDate', { futureDate: futureDateStr })
      .where('o.status IN (:...statuses)', { statuses: ['APPROVED', 'PROCESSING', 'SHIPPING'] })
      .orderBy('o.delivery_date', 'ASC')
      .limit(10)
      .getRawMany();

    return data.map((d) => ({
      orderId: d.orderId,
      orderNo: d.order_no,
      customerName: d.customerName,
      deliveryDate: d.delivery_date,
      grandTotal: parseFloat(d.grand_total),
      status: d.status,
    }));
  }

  async getDashboardSummary() {
    const [kpi, salesChart, topProducts, upcomingDeliveries] = await Promise.all([
      this.getKPI(),
      this.getSalesChart(30),
      this.getTopProducts(5),
      this.getUpcomingDeliveries(7),
    ]);

    return ResponseHelper.success(
      {
        kpi,
        salesChart,
        topProducts,
        upcomingDeliveries,
      },
      'OK',
    );
  }
}
