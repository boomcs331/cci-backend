import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';
import { REQUIRE_ADMIN_GLOBAL_KEY } from '../decorators/require-admin-global.decorator';

@Injectable()
export class AdminGlobalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ADMIN_GLOBAL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId = this.extractUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const isAdmin = await this.authService.isGlobalAdminUser(userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'ต้องเป็นผู้ดูแลระบบ (Global Admin) จึงจะจัดการ Role และ Permission ได้',
      );
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
}
