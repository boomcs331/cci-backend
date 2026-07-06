import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningBatch } from './entities/planning-batch.entity';
import { PlanningRow } from './entities/planning-row.entity';
import { PlanningError } from './entities/planning-error.entity';
import { PlanningHistory } from './entities/planning-history.entity';
import { PlanningBatchRepository } from './repositories/planning-batch.repository';
import { PlanningRowRepository } from './repositories/planning-row.repository';
import { PlanningErrorRepository } from './repositories/planning-error.repository';
import { PlanningValidationService } from './services/planning-validation.service';
import { PlanningTransformService } from './services/planning-transform.service';
import { PlanningImportService } from './services/planning-import.service';
// import { PlanningQueueService } from './services/planning-queue.service';
// import { PlanningQueueProcessor } from './queues/planning-queue.processor';
import { PlanningImportController } from './controllers/planning-import.controller';
import { PlanningDataController } from './controllers/planning-data.controller';
import { PlanningTemplateController } from './controllers/planning-template.controller';
import { Customer } from '../products/entities/customer.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanningBatch,
      PlanningRow,
      PlanningError,
      PlanningHistory,
      Customer,
      Product,
    ]),
    // BullModule.registerQueue({
    //   name: 'planning-import',
    //   redis: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //   },
    // }),
  ],
  controllers: [
    PlanningImportController,
    PlanningDataController,
    PlanningTemplateController,
  ],
  providers: [
    PlanningBatchRepository,
    PlanningRowRepository,
    PlanningErrorRepository,
    PlanningValidationService,
    PlanningTransformService,
    PlanningImportService,
    // PlanningQueueService,
    // PlanningQueueProcessor,
  ],
  exports: [
    PlanningBatchRepository,
    PlanningRowRepository,
    PlanningErrorRepository,
    PlanningValidationService,
    PlanningTransformService,
    PlanningImportService,
  ],
})
export class SalesPlanningModule {}
