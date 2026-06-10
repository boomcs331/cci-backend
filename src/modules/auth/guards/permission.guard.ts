import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import {
  DEPARTMENT_SCOPE_KEY,
  DepartmentScopeOptions,
} from '../decorators/department-scope.decorator';
import {
  PERMISSION_MATCH_MODE_KEY,
  PermissionMatchMode,
  REQUIRE_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const departmentId = this.extractDepartmentId(context, req);
    const mode =
      this.reflector.getAllAndOverride<PermissionMatchMode>(
        PERMISSION_MATCH_MODE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'all';

    if (mode === 'any') {
      for (const permissionCode of requiredPermissions) {
        const hasPermission = await this.authService.hasPermission(
          userId,
          permissionCode,
          departmentId,
        );
        if (hasPermission) {
          return true;
        }
      }
      throw new ForbiddenException('Insufficient permissions');
    }

    for (const permissionCode of requiredPermissions) {
      const hasPermission = await this.authService.hasPermission(
        userId,
        permissionCode,
        departmentId,
      );
      if (!hasPermission) {
        throw new ForbiddenException(`Missing permission: ${permissionCode}`);
      }
    }

    return true;
  }

  private extractUserId(req: {
    user?: { id?: string | number };
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const userIdFromRequest = req.user?.id;
    if (userIdFromRequest) {
      return String(userIdFromRequest);
    }

    const rawHeader = req.headers?.['x-user-id'];
    if (Array.isArray(rawHeader)) {
      return rawHeader[0];
    }
    return rawHeader;
  }

  private extractDepartmentId(
    context: ExecutionContext,
    req: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
      headers?: Record<string, string | string[] | undefined>;
    },
  ): string | undefined {
    const scopeOptions =
      this.reflector.getAllAndOverride<DepartmentScopeOptions>(
        DEPARTMENT_SCOPE_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (scopeOptions) {
      const scopedValue = this.readRequestValue(req, scopeOptions);
      if (scopedValue) {
        return scopedValue;
      }
    }

    const fallbackHeader = req.headers?.['x-department-id'];
    if (Array.isArray(fallbackHeader)) {
      return fallbackHeader[0];
    }

    if (typeof fallbackHeader === 'string') {
      return fallbackHeader;
    }

    const fallbackQuery = req.query?.departmentId;
    if (typeof fallbackQuery === 'string') {
      return fallbackQuery;
    }

    const fallbackParams = req.params?.departmentId;
    if (typeof fallbackParams === 'string') {
      return fallbackParams;
    }

    const fallbackBody = req.body?.departmentId;
    if (typeof fallbackBody === 'string') {
      return fallbackBody;
    }

    return undefined;
  }

  private readRequestValue(
    req: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
      headers?: Record<string, string | string[] | undefined>;
    },
    options: DepartmentScopeOptions,
  ): string | undefined {
    if (options.source === 'headers') {
      const headerValue = req.headers?.[options.key.toLowerCase()];
      if (Array.isArray(headerValue)) {
        return headerValue[0];
      }
      return headerValue;
    }

    const bag = req[options.source];
    const value = bag?.[options.key];
    return typeof value === 'string' ? value : undefined;
  }
}
