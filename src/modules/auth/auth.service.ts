import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AuthRbacService } from './services/auth-rbac.service';
import { AuthUserService } from './services/auth-user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUserService: AuthUserService,
    private readonly authRbacService: AuthRbacService,
  ) {}

  // User Management
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.authUserService.createUser(createUserDto);
  }

  async findUserById(id: string): Promise<User> {
    return this.authUserService.findUserById(id);
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.authUserService.findUserByEmail(email);
  }

  async findUserByUsername(username: string): Promise<User> {
    return this.authUserService.findUserByUsername(username);
  }

  async validateUser(username: string, password: string): Promise<User> {
    return this.authUserService.validateUser(username, password);
  }

  async login(loginDto: LoginDto): Promise<{ user: User; permissions: string[] }> {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);
    const permissions = await this.authUserService.getUserPermissions(user.id);

    return { user, permissions };
  }

  // Role Management
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.authRbacService.createRole(createRoleDto);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.authRbacService.findAllRoles();
  }

  async findRoleById(id: string): Promise<Role> {
    return this.authRbacService.findRoleById(id);
  }

  // Permission Management
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.authRbacService.createPermission(createPermissionDto);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.authRbacService.findAllPermissions();
  }

  async findPermissionById(id: string): Promise<Permission> {
    return this.authRbacService.findPermissionById(id);
  }

  // User Permission Check
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    return this.authUserService.hasPermission(userId, permissionCode);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    return this.authUserService.getUserPermissions(userId);
  }

  async getUserProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    roles: string[];
    permissions: string[];
  }> {
    return this.authUserService.getUserProfile(userId);
  }

  // Additional User CRUD Operations
  async findAllUsers(): Promise<User[]> {
    return this.authUserService.findAllUsers();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.authUserService.updateUser(id, updateUserDto);
  }

  async deleteUser(id: string): Promise<void> {
    return this.authUserService.deleteUser(id);
  }

  async toggleUserStatus(id: string): Promise<User> {
    return this.authUserService.toggleUserStatus(id);
  }

  // Role CRUD Operations
  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    return this.authRbacService.updateRole(id, updateRoleDto);
  }

  async deleteRole(id: string): Promise<void> {
    return this.authRbacService.deleteRole(id);
  }

  async toggleRoleStatus(id: string): Promise<Role> {
    return this.authRbacService.toggleRoleStatus(id);
  }

  async getRoleUsers(id: string): Promise<User[]> {
    return this.authRbacService.getRoleUsers(id);
  }

  // Permission CRUD Operations
  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    return this.authRbacService.updatePermission(id, updatePermissionDto);
  }

  async deletePermission(id: string): Promise<void> {
    return this.authRbacService.deletePermission(id);
  }

  async getPermissionRoles(id: string): Promise<Role[]> {
    return this.authRbacService.getPermissionRoles(id);
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return this.authRbacService.getPermissionsByModule(module);
  }

  async getAllModules(): Promise<string[]> {
    return this.authRbacService.getAllModules();
  }

  // Role-Permission Relationship Management
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    return this.authRbacService.assignPermissionsToRole(roleId, permissionIds);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role> {
    return this.authRbacService.removePermissionFromRole(roleId, permissionId);
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<Role> {
    return this.authRbacService.addPermissionToRole(roleId, permissionId);
  }

  // User-Role Relationship Management
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<User> {
    return this.authUserService.assignRolesToUser(userId, roleIds);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    return this.authUserService.removeRoleFromUser(userId, roleId);
  }

  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    return this.authUserService.addRoleToUser(userId, roleId);
  }

  // Bulk operations
  async getUsersWithRole(roleId: string): Promise<User[]> {
    return this.authUserService.getUsersWithRole(roleId);
  }

  async getRolesWithPermission(permissionId: string): Promise<Role[]> {
    return this.authRbacService.getRolesWithPermission(permissionId);
  }
}