import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiLog, AuthLog } from './entities';
import { ApiAuditService } from './services/api-audit.service';
import { LogsController } from './controllers/logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiLog, AuthLog])],
  controllers: [LogsController],
  providers: [ApiAuditService],
  exports: [ApiAuditService],
})
export class AuditModule {}
