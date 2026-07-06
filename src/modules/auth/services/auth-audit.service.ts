import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  AuthLog,
  AuthAction,
} from '../../../core/audit/entities/auth-log.entity';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface LoginAuditLog {
  timestamp: string;
  action:
    | 'LOGIN_ATTEMPT'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'REGISTRATION_ATTEMPT'
    | 'REGISTRATION_SUCCESS'
    | 'REGISTRATION_FAILED';
  username: string;
  email?: string;
  userId?: string;
  clientIp: string;
  userAgent: string;
  duration: number;
  errorMessage?: string;
  roles?: string[];
  permissionCount?: number;
}

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);
  private readonly logDir = join(process.cwd(), 'logs');
  private readonly auditLogFile = join(this.logDir, 'auth-audit.log');

  constructor(
    @InjectRepository(AuthLog)
    private readonly authLogRepository: Repository<AuthLog>,
  ) {
    // Create logs directory if it doesn't exist (for backup file logging)
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async logLoginAttempt(username: string, clientIp: string, userAgent: string) {
    try {
      // Intentionally do not persist or emit LOGIN_ATTEMPT events.
      void username;
      void clientIp;
      void userAgent;
    } catch (error) {
      this.logger.error(`Failed to log login attempt: ${error.message}`);
    }
  }

  async logLoginSuccess(
    username: string,
    email: string,
    userId: string,
    clientIp: string,
    userAgent: string,
    duration: number,
    roles: string[],
    permissionCount: number,
  ) {
    try {
      const authLog = this.authLogRepository.create({
        action: AuthAction.LOGIN_SUCCESS,
        username,
        email,
        userId,
        clientIp,
        userAgent,
        duration,
        roles,
        permissionCount,
        isSuccess: true,
      });

      await this.authLogRepository.save(authLog);

      // Backup to file
      const logEntry: LoginAuditLog = {
        timestamp: new Date().toISOString(),
        action: 'LOGIN_SUCCESS',
        username,
        email,
        userId,
        clientIp,
        userAgent,
        duration,
        roles,
        permissionCount,
      };
      this.writeAuditLog(logEntry);

      this.logger.log(
        `Login successful: ${username} (${userId}) from ${clientIp} - Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Failed to log login success: ${error.message}`);
    }
  }

  async logLoginFailure(
    username: string,
    clientIp: string,
    userAgent: string,
    duration: number,
    errorMessage: string,
  ) {
    try {
      const authLog = this.authLogRepository.create({
        action: AuthAction.LOGIN_FAILED,
        username,
        clientIp,
        userAgent,
        duration,
        errorMessage,
        isSuccess: false,
      });

      await this.authLogRepository.save(authLog);

      // Backup to file
      const logEntry: LoginAuditLog = {
        timestamp: new Date().toISOString(),
        action: 'LOGIN_FAILED',
        username,
        clientIp,
        userAgent,
        duration,
        errorMessage,
      };
      this.writeAuditLog(logEntry);

      this.logger.warn(
        `Login failed: ${username} from ${clientIp} - Error: ${errorMessage} - Duration: ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(`Failed to log login failure: ${error.message}`);
    }
  }

  logRegistrationAttempt(
    username: string,
    email: string,
    clientIp: string,
    userAgent: string,
  ) {
    const logEntry: LoginAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'REGISTRATION_ATTEMPT',
      username,
      email,
      clientIp,
      userAgent,
      duration: 0,
    };

    this.writeAuditLog(logEntry);
    this.logger.log(
      `Registration attempt: ${username} (${email}) from ${clientIp}`,
    );
  }

  logRegistrationSuccess(
    username: string,
    email: string,
    userId: string,
    clientIp: string,
    userAgent: string,
    duration: number,
    roles: string[],
  ) {
    const logEntry: LoginAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'REGISTRATION_SUCCESS',
      username,
      email,
      userId,
      clientIp,
      userAgent,
      duration,
      roles,
    };

    this.writeAuditLog(logEntry);
    this.logger.log(
      `Registration successful: ${username} (${userId}) from ${clientIp} - Duration: ${duration}ms`,
    );
  }

  logRegistrationFailure(
    username: string,
    email: string,
    clientIp: string,
    userAgent: string,
    duration: number,
    errorMessage: string,
  ) {
    const logEntry: LoginAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'REGISTRATION_FAILED',
      username,
      email,
      clientIp,
      userAgent,
      duration,
      errorMessage,
    };

    this.writeAuditLog(logEntry);
    this.logger.warn(
      `Registration failed: ${username} (${email}) from ${clientIp} - Error: ${errorMessage} - Duration: ${duration}ms`,
    );
  }

  private writeAuditLog(logEntry: LoginAuditLog) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      writeFileSync(this.auditLogFile, logLine, { flag: 'a' });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  // Method to get recent login attempts (for monitoring)
  async getRecentLoginAttempts(limit: number = 100): Promise<AuthLog[]> {
    try {
      return await this.authLogRepository.find({
        order: { loggedAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get recent login attempts: ${error.message}`,
      );
      return [];
    }
  }

  // Method to get failed login attempts for security monitoring
  async getFailedLoginAttempts(
    timeWindowMinutes: number = 60,
  ): Promise<AuthLog[]> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      return await this.authLogRepository.find({
        where: {
          action: AuthAction.LOGIN_FAILED,
          loggedAt: MoreThan(cutoffTime),
        },
        order: { loggedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get failed login attempts: ${error.message}`,
      );
      return [];
    }
  }

  // Get login statistics
  async getLoginStatistics(timeWindowMinutes: number = 60): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const [totalAttempts, successfulLogins, failedLogins] = await Promise.all(
        [
          this.authLogRepository.count({
            where: {
              action: AuthAction.LOGIN_ATTEMPT,
              loggedAt: MoreThan(cutoffTime),
            },
          }),
          this.authLogRepository.count({
            where: {
              action: AuthAction.LOGIN_SUCCESS,
              loggedAt: MoreThan(cutoffTime),
            },
          }),
          this.authLogRepository.count({
            where: {
              action: AuthAction.LOGIN_FAILED,
              loggedAt: MoreThan(cutoffTime),
            },
          }),
        ],
      );

      // Get top failed IPs
      const topFailedIPs = await this.authLogRepository
        .createQueryBuilder('log')
        .select('log.clientIp', 'ip')
        .addSelect('COUNT(*)', 'count')
        .where('log.action = :action', { action: AuthAction.LOGIN_FAILED })
        .andWhere('log.loggedAt > :cutoffTime', { cutoffTime })
        .groupBy('log.clientIp')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalAttempts,
        successfulLogins,
        failedLogins,
        successRate:
          totalAttempts > 0
            ? Math.round((successfulLogins / totalAttempts) * 100)
            : 0,
        topFailedIPs: topFailedIPs.reduce((acc, item) => {
          acc[item.ip] = parseInt(item.count);
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error(`Failed to get login statistics: ${error.message}`);
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        successRate: 0,
        topFailedIPs: {},
      };
    }
  }
}
