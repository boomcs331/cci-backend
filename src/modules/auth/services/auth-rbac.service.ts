import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Department } from '../entities/department.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthRbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  private sanitizeUsers<T extends { passwordHash?: string }>(
    users: T[],
  ): Omit<T, 'passwordHash'>[] {
    return users.map((user) => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { code, permissionIds, ...roleData } = createRoleDto;
    const existingRole = await this.roleRepository.findOne({ where: { code } });
    if (existingRole) {
      throw new ConflictException('Role code already exists');
    }

    const role = this.roleRepository.create({ code, ...roleData });
    if (permissionIds && permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.findBy({
        id: In(permissionIds),
      });
    }
    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { permissionIds, ...updateData } = updateRoleDto;
    const role = await this.findRoleById(id);

    if (updateData.code && updateData.code !== role.code) {
      const existingRole = await this.roleRepository.findOne({
        where: { code: updateData.code },
      });
      if (existingRole) {
        throw new ConflictException('Role code already exists');
      }
    }

    Object.assign(role, updateData);
    if (permissionIds && permissionIds.length >= 0) {
      role.permissions =
        permissionIds.length === 0
          ? []
          : await this.permissionRepository.findBy({ id: In(permissionIds) });
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }
    await this.roleRepository.remove(role);
  }

  async toggleRoleStatus(id: string): Promise<Role> {
    const role = await this.findRoleById(id);
    if (role.isSystem) {
      throw new ConflictException('Cannot modify system role status');
    }
    role.isSystem = !role.isSystem;
    return this.roleRepository.save(role);
  }

  async getRoleUsers(id: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.sanitizeUsers(role.users) as User[];
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    const { code } = createPermissionDto;
    const existingPermission = await this.permissionRepository.findOne({
      where: { code },
    });
    if (existingPermission) {
      throw new ConflictException('Permission code already exists');
    }
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findPermissionById(id);
    if (
      updatePermissionDto.code &&
      updatePermissionDto.code !== permission.code
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
      });
      if (existingPermission) {
        throw new ConflictException('Permission code already exists');
      }
    }
    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    const permissionWithRoles = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (permissionWithRoles && permissionWithRoles.roles.length > 0) {
      throw new ConflictException(
        'Cannot delete permission that is assigned to roles',
      );
    }
    await this.permissionRepository.remove(permission);
  }

  async getPermissionRoles(id: string): Promise<Role[]> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.users'],
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission.roles;
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { module },
      relations: ['roles'],
    });
  }

  async getAllModules(): Promise<string[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.module', 'module')
      .where('permission.module IS NOT NULL')
      .getRawMany();
    return permissions.map((item) => item.module).filter(Boolean);
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    if (permissionIds.length === 0) {
      role.permissions = [];
    } else {
      const permissions = await this.permissionRepository.findBy({
        id: In(permissionIds),
      });
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions not found');
      }
      role.permissions = permissions;
    }
    return this.roleRepository.save(role);
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    role.permissions = role.permissions.filter(
      (permission) => permission.id !== permissionId,
    );
    return this.roleRepository.save(role);
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permission = await this.findPermissionById(permissionId);
    const isAlreadyAssigned = role.permissions.some(
      (item) => item.id === permissionId,
    );
    if (isAlreadyAssigned) {
      throw new ConflictException('Permission already assigned to this role');
    }
    role.permissions.push(permission);
    return this.roleRepository.save(role);
  }

  async getRolesWithPermission(permissionId: string): Promise<Role[]> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission.roles;
  }

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    const existingDepartment = await this.departmentRepository.findOne({
      where: { code: createDepartmentDto.code },
    });
    if (existingDepartment) {
      throw new ConflictException('Department code already exists');
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async findAllDepartments(): Promise<Department[]> {
    return this.departmentRepository.find({
      order: { code: 'ASC' },
    });
  }

  async findDepartmentById(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findDepartmentById(id);

    if (
      updateDepartmentDto.code &&
      updateDepartmentDto.code !== department.code
    ) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { code: updateDepartmentDto.code },
      });
      if (existingDepartment) {
        throw new ConflictException('Department code already exists');
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async deleteDepartment(id: string): Promise<void> {
    const department = await this.findDepartmentById(id);
    await this.departmentRepository.remove(department);
  }
}
