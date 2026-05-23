import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthAuditController } from './controllers/auth-audit.controller';
import { AuthPermissionsController } from './controllers/auth-permissions.controller';
import { AuthRolesController } from './controllers/auth-roles.controller';
import { AuthUsersController } from './controllers/auth-users.controller';
import { AuthDepartmentsController } from './controllers/auth-departments.controller';
import { AuthMenusController } from './controllers/auth-menus.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Department } from './entities/department.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { UserDepartment } from './entities/user-department.entity';
import { Menu } from './entities/menu.entity';
import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthSanitizeUserInterceptor } from './interceptors/auth-sanitize-user.interceptor';
import { AuthAuditService } from './services/auth-audit.service';
import { AuthUserService } from './services/auth-user.service';
import { AuthRbacService } from './services/auth-rbac.service';
import { AuthMenuService } from './services/auth-menu.service';
import { ApiLog, AuthLog } from '../../core/audit/entities';
import { PermissionGuard } from './guards/permission.guard';
import { AdminGlobalGuard } from './guards/admin-global.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      Department,
      UserRoleAssignment,
      UserDepartment,
      Menu,
      AuthLog,
      ApiLog,
    ]),
  ],
  controllers: [
    AuthController,
    AuthUsersController,
    AuthRolesController,
    AuthPermissionsController,
    AuthDepartmentsController,
    AuthMenusController,
    AuthAuditController,
  ],
  providers: [
    AuthService,
    AuthAuditService,
    AuthUserService,
    AuthRbacService,
    AuthMenuService,
    AdminGlobalGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    AuthSanitizeUserInterceptor,
    AuthLoggerMiddleware,
  ],
  exports: [AuthService, AuthAuditService, AuthUserService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthLoggerMiddleware).forRoutes('auth');
  }
}
