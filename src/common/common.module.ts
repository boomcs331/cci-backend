import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiAuditService } from './services/api-audit.service';
import { LogsController } from './controllers/logs.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ApiLog } from './entities/api-log.entity';
import { AuthLog } from './entities/auth-log.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiLog, AuthLog]),
  ],
  providers: [ApiAuditService, LoggingInterceptor],
  controllers: [LogsController],
  exports: [ApiAuditService, LoggingInterceptor, TypeOrmModule],
})
export class CommonModule {}