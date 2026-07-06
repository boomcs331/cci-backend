import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLog, AuthLog, QrScanLog } from './entities';
import { ApiAuditService } from './services/api-audit.service';
import { QrScanLogService } from './services/qr-scan-log.service';
import { LogsController } from './controllers/logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLog, AuthLog, QrScanLog])],
  controllers: [LogsController],
  providers: [ApiAuditService, QrScanLogService],
  exports: [ApiAuditService, QrScanLogService],
})
export class AuditModule {}
