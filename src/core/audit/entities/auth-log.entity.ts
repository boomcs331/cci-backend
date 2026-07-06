import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuthAction {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTRATION_ATTEMPT = 'REGISTRATION_ATTEMPT',
  REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

@Entity({ schema: 'logs', name: 'auth_logs' })
@Index(['action'])
@Index(['username'])
@Index(['clientIp'])
export class AuthLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @CreateDateColumn({ name: 'logged_at', type: 'timestamp' })
  loggedAt: Date;

  @Column({
    type: 'enum',
    enum: AuthAction,
  })
  action: AuthAction;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: 'user_id', length: 50, nullable: true })
  userId: string;

  @Column({ name: 'client_ip', length: 45 })
  clientIp: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  roles: string[];

  @Column({ name: 'permission_count', type: 'int', nullable: true })
  permissionCount: number;

  @Column({ name: 'is_success', type: 'boolean', default: false })
  @Index()
  isSuccess: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional context data
}
