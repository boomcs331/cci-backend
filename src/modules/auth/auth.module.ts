import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthLog } from '../../core/audit/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, AuthLog]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthAuditService],
  exports: [AuthService, AuthAuditService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthLoggerMiddleware)
      .forRoutes('auth');
  }
}