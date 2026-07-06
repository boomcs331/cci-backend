import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { User } from './user.entity';

@Entity({ schema: 'auth', name: 'user_departments' })
export class UserDepartment {
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'bigint', name: 'department_id' })
  departmentId: string;

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userDepartments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Department, (department) => department.userDepartments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
