import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../libs/common/src/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductionPlansModule } from './modules/production-plans/production-plans.module';
import { ProductionOrdersModule } from './modules/production-orders/production-orders.module';
import { SalesModule } from './modules/sales/sales.module';
import { AuditModule } from './core/audit/audit.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { BusinessModule } from './business/business.module';
import { SalesPlanningModule } from './modules/sales-planning/sales-planning.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // docker-compose.host-db.yml ตั้ง DOCKER_CONTAINER=1 — ใช้แต่ env จาก Docker (กัน .env บน host ที่มี DB_HOST=localhost)
      ignoreEnvFile: process.env.DOCKER_CONTAINER === '1',
    }),
    DatabaseModule,
    CommonModule,
    BusinessModule,
    AuditModule,
    AuthModule,
    MaterialsModule,
    ProductsModule,
    ProductionPlansModule,
    ProductionOrdersModule,
    SalesModule,
    SalesPlanningModule,
    AiChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
