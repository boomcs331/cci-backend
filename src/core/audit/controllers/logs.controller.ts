import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiAuditService } from '../services/api-audit.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly apiAuditService: ApiAuditService) {}

  @Get('api/recent')
  async getRecentApiCalls(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const logs = await this.apiAuditService.getRecentApiCalls(limitNum);
    return { logs, count: logs.length };
  }

  @Get('api/errors')
  async getRecentErrors(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const logs = await this.apiAuditService.getRecentErrors(limitNum);
    return { logs, count: logs.length };
  }

  @Get('api/statistics')
  async getApiStatistics(@Query('timeWindow') timeWindow?: string) {
    const timeWindowNum = timeWindow ? parseInt(timeWindow, 10) : 60;
    const stats = await this.apiAuditService.getApiStatistics(timeWindowNum);
    return { statistics: stats, timeWindowMinutes: timeWindowNum };
  }

  @Get('api/slow')
  async getSlowRequests(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string
  ) {
    const thresholdNum = threshold ? parseInt(threshold, 10) : 1000;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const logs = await this.apiAuditService.getSlowRequests(thresholdNum, limitNum);
    return { 
      logs, 
      count: logs.length, 
      thresholdMs: thresholdNum 
    };
  }

  @Get('api/by-ip/:ip')
  async getRequestsByIP(
    @Param('ip') ip: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const logs = await this.apiAuditService.getRequestsByIP(ip, limitNum);
    return { 
      logs, 
      count: logs.length, 
      ip 
    };
  }

  @Get('api/by-endpoint')
  async getRequestsByEndpoint(
    @Query('method') method: string,
    @Query('url') url: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const logs = await this.apiAuditService.getRequestsByEndpoint(method, url, limitNum);
    return { 
      logs, 
      count: logs.length, 
      method, 
      url 
    };
  }

  @Get('health')
  async getLogHealth() {
    const recentLogs = await this.apiAuditService.getRecentApiCalls(10);
    const recentErrors = await this.apiAuditService.getRecentErrors(5);
    const stats = await this.apiAuditService.getApiStatistics(5); // Last 5 minutes

    return {
      status: 'healthy',
      lastLogTime: recentLogs.length > 0 ? recentLogs[0].loggedAt : null,
      recentErrorCount: recentErrors.length,
      recentRequestCount: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime,
    };
  }

  @Get('database/stats')
  async getDatabaseStats() {
    const stats = await this.apiAuditService.getDatabaseStats();
    return { databaseStats: stats };
  }

  @Get('database/cleanup')
  async cleanupOldLogs(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days, 10) : 90;
    const deletedCount = await this.apiAuditService.cleanOldLogs(daysToKeep);
    return { 
      message: `Cleaned up old logs`,
      deletedCount,
      daysToKeep 
    };
  }
}