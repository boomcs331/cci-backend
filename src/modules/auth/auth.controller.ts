import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthAuditService } from './services/auth-audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { withMessage } from './utils/auth-response.util';
import { AuthSanitizeUserInterceptor } from './interceptors/auth-sanitize-user.interceptor';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuthAuditService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log registration attempt
    this.auditService.logRegistrationAttempt(createUserDto.username, createUserDto.email || '', clientIp, userAgent);
    
    try {
      const user = await this.authService.createUser(createUserDto);
      const duration = Date.now() - startTime;
      const roles = user.roles?.map(r => r.code) || [];
      
      // Log successful registration
      this.auditService.logRegistrationSuccess(
        user.username,
        user.email,
        user.id,
        clientIp,
        userAgent,
        duration,
        roles
      );
      
      return withMessage('User created successfully', 'user', user);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed registration
      this.auditService.logRegistrationFailure(
        createUserDto.username,
        createUserDto.email || '',
        clientIp,
        userAgent,
        duration,
        error.message
      );
      
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const startTime = Date.now();
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log login attempt
    await this.auditService.logLoginAttempt(loginDto.username, clientIp, userAgent);
    
    try {
      const { user, permissions } = await this.authService.login(loginDto);
      const duration = Date.now() - startTime;
      const roles = user.roles?.map(r => r.code) || [];
      
      // Log successful login
      await this.auditService.logLoginSuccess(
        user.username,
        user.email,
        user.id,
        clientIp,
        userAgent,
        duration,
        roles,
        permissions?.length || 0
      );
      
      return {
        ...withMessage('Login successful', 'user', user),
        permissions,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed login
      await this.auditService.logLoginFailure(
        loginDto.username,
        clientIp,
        userAgent,
        duration,
        error.message
      );
      
      throw error;
    }
  }
}