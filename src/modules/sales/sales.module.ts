import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { SalesInventoryService } from './sales-inventory.service';
import { SalesImportController } from './sales-import.controller';
import { SalesImportService } from './sales-import.service';
import { SalesDashboardController } from './sales-dashboard.controller';
import { SalesDashboardService } from './sales-dashboard.service';
import { SalesReportsController } from './sales-reports.controller';
import { SalesReportsService } from './sales-reports.service';
import { SalesProductsController } from './sales-products.controller';
import { SalesProductsService } from './sales-products.service';
import { SalesCustomersController } from './sales-customers.controller';
import { SalesCustomersService } from './sales-customers.service';
import {
  SalesOrder,
  OrderItem,
  OrderStatusHistory,
  OrderApproval,
  ProductStockMovement,
  ImportBatch,
  ImportRow,
} from './entities';
import { Customer } from '../products/entities/customer.entity';
import { ProductsStock } from '../products/entities/products-stock.entity';
import { Product } from '../products/entities/product.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      SalesOrder,
      OrderItem,
      OrderStatusHistory,
      OrderApproval,
      ProductStockMovement,
      ImportBatch,
      ImportRow,
      Customer,
      ProductsStock,
      Product,
    ]),
  ],
  controllers: [SalesOrdersController, SalesImportController, SalesDashboardController, SalesReportsController, SalesProductsController, SalesCustomersController],
  providers: [SalesOrdersService, SalesInventoryService, SalesImportService, SalesDashboardService, SalesReportsService, SalesProductsService, SalesCustomersService],
  exports: [SalesOrdersService, SalesInventoryService, SalesImportService, SalesDashboardService, SalesReportsService, SalesProductsService, SalesCustomersService],
})
export class SalesModule {}
