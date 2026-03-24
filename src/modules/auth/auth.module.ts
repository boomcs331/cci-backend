import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthAuditController } from './controllers/auth-audit.controller';
import { AuthPermissionsController } from './controllers/auth-permissions.controller';
import { AuthRolesController } from './controllers/auth-roles.controller';
import { AuthUsersController } from './controllers/auth-users.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthSanitizeUserInterceptor } from './interceptors/auth-sanitize-user.interceptor';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthUserService } from './services/auth-user.service';
import { AuthRbacService } from './services/auth-rbac.service';
import { ApiLog, AuthLog } from '../../core/audit/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, AuthLog, ApiLog]),
  ],
  controllers: [
    AuthController,
    AuthUsersController,
    AuthRolesController,
    AuthPermissionsController,
    AuthAuditController,
  ],
  providers: [
    AuthService,
    AuthAuditService,
    AuthUserService,
    AuthRbacService,
    AuthSanitizeUserInterceptor,
    AuthLoggerMiddleware,
  ],
  exports: [AuthService, AuthAuditService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthLoggerMiddleware)
      .forRoutes('auth');
  }
}