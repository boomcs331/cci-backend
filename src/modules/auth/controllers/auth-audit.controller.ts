import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { AuthAuditService } from '../services/auth-audit.service';
import { withCollection } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthAuditController {
  constructor(private readonly auditService: AuthAuditService) {}

  @Get('audit/recent-logins')
  async getRecentLoginAttempts() {
    const logs = await this.auditService.getRecentLoginAttempts(100);
    return withCollection('logs', logs);
  }

  @Get('audit/failed-logins')
  async getFailedLoginAttempts() {
    const logs = await this.auditService.getFailedLoginAttempts(60);
    return withCollection('logs', logs);
  }

  @Get('audit/login-statistics')
  async getLoginStatistics(@Query('timeWindow') timeWindow?: string) {
    const timeWindowNum = timeWindow ? parseInt(timeWindow, 10) : 60;
    const stats = await this.auditService.getLoginStatistics(timeWindowNum);
    return { statistics: stats, timeWindowMinutes: timeWindowNum };
  }
}
