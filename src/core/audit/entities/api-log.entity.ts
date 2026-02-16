import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('api_logs')
@Index(['timestamp'])
@Index(['clientIp'])
@Index(['statusCode'])
@Index(['method', 'url'])
export class ApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ name: 'request_id', length: 50 })
  @Index()
  requestId: string;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 500 })
  url: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ name: 'client_ip', length: 45 })
  clientIp: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'request_size', type: 'int', default: 0 })
  requestSize: number;

  @Column({ name: 'response_size', type: 'int', default: 0 })
  responseSize: number;

  @Column({ type: 'json', nullable: true })
  query: any;

  @Column({ type: 'json', nullable: true })
  params: any;

  @Column({ type: 'json', nullable: true })
  body: any;

  @Column({ type: 'json', nullable: true })
  headers: any;

  @Column({ type: 'json', nullable: true })
  response: any;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'is_error', type: 'boolean', default: false })
  @Index()
  isError: boolean;

  @Column({ name: 'is_slow', type: 'boolean', default: false })
  @Index()
  isSlow: boolean; // duration > threshold
}