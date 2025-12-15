import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { ApiLog } from '../entities/api-log.entity';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ApiAuditLog {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  clientIp: string;
  userAgent: string;
  requestSize: number;
  responseSize: number;
  query?: any;
  params?: any;
  body?: any;
  headers?: any;
  response?: any;
  error?: string;
}

@Injectable()
export class ApiAuditService {
  private readonly logger = new Logger(ApiAuditService.name);
  private readonly logDir = join(process.cwd(), 'logs');
  private readonly apiLogFile = join(this.logDir, 'api-audit.log');
  private readonly errorLogFile = join(this.logDir, 'api-errors.log');

  constructor(
    @InjectRepository(ApiLog)
    private readonly apiLogRepository: Repository<ApiLog>,
  ) {
    // Create logs directory if it doesn't exist (for backup file logging)
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async logApiRequest(logData: ApiAuditLog) {
    try {
      // Save to database
      const apiLog = this.apiLogRepository.create({
        requestId: logData.requestId,
        method: logData.method,
        url: logData.url,
        statusCode: logData.statusCode,
        duration: logData.duration,
        clientIp: logData.clientIp,
        userAgent: logData.userAgent,
        requestSize: logData.requestSize,
        responseSize: logData.responseSize,
        query: logData.query,
        params: logData.params,
        body: logData.body,
        headers: logData.headers,
        response: logData.response,
        error: logData.error,
        isError: logData.statusCode >= 400,
        isSlow: logData.duration > 1000, // Consider > 1s as slow
      });

      await this.apiLogRepository.save(apiLog);

      // Backup to file (optional)
      const logEntry = {
        ...logData,
        timestamp: new Date().toISOString(),
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      writeFileSync(this.apiLogFile, logLine, { flag: 'a' });

      // Write errors to separate error log
      if (logData.statusCode >= 400) {
        writeFileSync(this.errorLogFile, logLine, { flag: 'a' });
      }

      // Console logging based on status
      if (logData.statusCode >= 500) {
        this.logger.error(`[${logData.requestId}] ${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}ms - ${logData.error || 'Server Error'}`);
      } else if (logData.statusCode >= 400) {
        this.logger.warn(`[${logData.requestId}] ${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}ms - ${logData.error || 'Client Error'}`);
      } else {
        this.logger.log(`[${logData.requestId}] ${logData.method} ${logData.url} - ${logData.statusCode} - ${logData.duration}ms`);
      }
    } catch (error) {
      this.logger.error(`Failed to write API audit log: ${error.message}`);
      
      // Fallback to file logging if database fails
      try {
        const logEntry = {
          ...logData,
          timestamp: new Date().toISOString(),
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        writeFileSync(this.apiLogFile, logLine, { flag: 'a' });
      } catch (fileError) {
        this.logger.error(`Failed to write backup file log: ${fileError.message}`);
      }
    }
  }

  // Get recent API calls
  async getRecentApiCalls(limit: number = 100): Promise<ApiLog[]> {
    try {
      return await this.apiLogRepository.find({
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get recent API calls: ${error.message}`);
      return [];
    }
  }

  // Get error logs
  async getRecentErrors(limit: number = 50): Promise<ApiLog[]> {
    try {
      return await this.apiLogRepository.find({
        where: { isError: true },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get recent errors: ${error.message}`);
      return [];
    }
  }

  // Get API statistics
  async getApiStatistics(timeWindowMinutes: number = 60): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const [
        totalRequests,
        successfulRequests,
        clientErrors,
        serverErrors,
        avgDuration,
        slowestRequest,
        fastestRequest,
      ] = await Promise.all([
        this.apiLogRepository.count({
          where: { timestamp: MoreThan(cutoffTime) },
        }),
        this.apiLogRepository.count({
          where: { 
            timestamp: MoreThan(cutoffTime),
            statusCode: Between(200, 399),
          },
        }),
        this.apiLogRepository.count({
          where: { 
            timestamp: MoreThan(cutoffTime),
            statusCode: Between(400, 499),
          },
        }),
        this.apiLogRepository.count({
          where: { 
            timestamp: MoreThan(cutoffTime),
            statusCode: Between(500, 599),
          },
        }),
        this.apiLogRepository
          .createQueryBuilder('log')
          .select('AVG(log.duration)', 'avg')
          .where('log.timestamp > :cutoffTime', { cutoffTime })
          .getRawOne(),
        this.apiLogRepository.findOne({
          where: { timestamp: MoreThan(cutoffTime) },
          order: { duration: 'DESC' },
        }),
        this.apiLogRepository.findOne({
          where: { timestamp: MoreThan(cutoffTime) },
          order: { duration: 'ASC' },
        }),
      ]);

      // Get top endpoints
      const topEndpointsQuery = await this.apiLogRepository
        .createQueryBuilder('log')
        .select('CONCAT(log.method, \' \', log.url)', 'endpoint')
        .addSelect('COUNT(*)', 'count')
        .where('log.timestamp > :cutoffTime', { cutoffTime })
        .groupBy('log.method, log.url')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      // Get top IPs
      const topIPsQuery = await this.apiLogRepository
        .createQueryBuilder('log')
        .select('log.clientIp', 'ip')
        .addSelect('COUNT(*)', 'count')
        .where('log.timestamp > :cutoffTime', { cutoffTime })
        .groupBy('log.clientIp')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const topEndpoints: Record<string, number> = {};
      topEndpointsQuery.forEach(item => {
        topEndpoints[item.endpoint] = parseInt(item.count);
      });

      const topIPs: Record<string, number> = {};
      topIPsQuery.forEach(item => {
        topIPs[item.ip] = parseInt(item.count);
      });

      return {
        totalRequests,
        successfulRequests,
        clientErrors,
        serverErrors,
        averageResponseTime: Math.round(avgDuration?.avg || 0),
        slowestRequest,
        fastestRequest,
        topEndpoints,
        topIPs,
      };
    } catch (error) {
      this.logger.error(`Failed to get API statistics: ${error.message}`);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        clientErrors: 0,
        serverErrors: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null,
        topEndpoints: {},
        topIPs: {},
      };
    }
  }

  // Get slow requests
  async getSlowRequests(thresholdMs: number = 1000, limit: number = 20): Promise<ApiLog[]> {
    try {
      return await this.apiLogRepository.find({
        where: { duration: MoreThan(thresholdMs) },
        order: { duration: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get slow requests: ${error.message}`);
      return [];
    }
  }

  // Get requests by IP
  async getRequestsByIP(ip: string, limit: number = 50): Promise<ApiLog[]> {
    try {
      return await this.apiLogRepository.find({
        where: { clientIp: ip },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get requests by IP: ${error.message}`);
      return [];
    }
  }

  // Get requests by endpoint
  async getRequestsByEndpoint(method: string, url: string, limit: number = 50): Promise<ApiLog[]> {
    try {
      return await this.apiLogRepository
        .createQueryBuilder('log')
        .where('log.method = :method', { method })
        .andWhere('log.url LIKE :url', { url: `%${url}%` })
        .orderBy('log.timestamp', 'DESC')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to get requests by endpoint: ${error.message}`);
      return [];
    }
  }

  // Clean old logs (for maintenance)
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.apiLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned ${result.affected} old API logs older than ${daysToKeep} days`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to clean old logs: ${error.message}`);
      return 0;
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<any> {
    try {
      const [totalLogs, errorLogs, slowLogs, oldestLog, newestLog] = await Promise.all([
        this.apiLogRepository.count(),
        this.apiLogRepository.count({ where: { isError: true } }),
        this.apiLogRepository.count({ where: { isSlow: true } }),
        this.apiLogRepository.findOne({ order: { timestamp: 'ASC' } }),
        this.apiLogRepository.findOne({ order: { timestamp: 'DESC' } }),
      ]);

      return {
        totalLogs,
        errorLogs,
        slowLogs,
        oldestLog: oldestLog?.timestamp,
        newestLog: newestLog?.timestamp,
      };
    } catch (error) {
      this.logger.error(`Failed to get database stats: ${error.message}`);
      return {
        totalLogs: 0,
        errorLogs: 0,
        slowLogs: 0,
        oldestLog: null,
        newestLog: null,
      };
    }
  }
}