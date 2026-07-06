import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { SalesOrdersService } from './services/sales-orders.service';
import { SalesInventoryService } from './services/sales-inventory.service';
import { SalesImportController } from './controllers/sales-import.controller';
import { SalesImportService } from './services/sales-import.service';
import { SalesDashboardController } from './controllers/sales-dashboard.controller';
import { SalesDashboardService } from './services/sales-dashboard.service';
import { SalesReportsController } from './controllers/sales-reports.controller';
import { SalesReportsService } from './services/sales-reports.service';
import { SalesProductsController } from './controllers/sales-products.controller';
import { SalesProductsService } from './services/sales-products.service';
import { SalesCustomersController } from './controllers/sales-customers.controller';
import { SalesCustomersService } from './services/sales-customers.service';
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
