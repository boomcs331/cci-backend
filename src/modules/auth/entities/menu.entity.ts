import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'auth', name: 'menus' })
export class Menu {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  label: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'icon_key' })
  iconKey?: string | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_collapsible' })
  isCollapsible: boolean;

  @Column({ type: 'boolean', default: false, name: 'admin_only' })
  adminOnly: boolean;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'permission_codes',
  })
  permissionCodes?: string[] | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'all',
    name: 'permission_match',
  })
  permissionMatch: 'all' | 'any';

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'allowed_departments',
  })
  allowedDepartments?: string[] | null;

  @Column({ type: 'bigint', nullable: true, name: 'parent_id' })
  parentId?: string | null;

  @ManyToOne(() => Menu, (menu) => menu.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Menu | null;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
