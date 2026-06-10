import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Department } from './entities/department.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AuthRbacService } from './services/auth-rbac.service';
import { AuthUserService } from './services/auth-user.service';
import {
  AuthMenuService,
  MenuNode,
  MenuRecord,
} from './services/auth-menu.service';
import { RoleAssignmentItemDto } from './dto/assign-roles.dto';
import { ScopedRoleAssignmentDto } from './dto/assign-scoped-roles.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUserService: AuthUserService,
    private readonly authRbacService: AuthRbacService,
    private readonly authMenuService: AuthMenuService,
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

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: User; permissions: string[]; menus: MenuNode[] }> {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);
    const fullUser = await this.authUserService.findUserById(user.id);
    const permissions = await this.authUserService.getUserPermissions(
      user.id,
    );
    const menus = await this.authMenuService.getMenuForUser(user.id);

    return { user: fullUser, permissions, menus };
  }

  async getNavigationMenu(
    userId: string,
    departmentId?: string,
  ): Promise<MenuNode[]> {
    return this.authMenuService.getMenuForUser(userId, departmentId);
  }

  async findAllMenus(): Promise<MenuRecord[]> {
    return this.authMenuService.findAllMenus();
  }

  async findMenuById(id: string): Promise<MenuRecord> {
    return this.authMenuService.findMenuById(id);
  }

  async createMenu(createMenuDto: CreateMenuDto): Promise<MenuRecord> {
    return this.authMenuService.createMenu(createMenuDto);
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDto): Promise<MenuRecord> {
    return this.authMenuService.updateMenu(id, updateMenuDto);
  }

  async deleteMenu(id: string): Promise<void> {
    return this.authMenuService.deleteMenu(id);
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
  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.authRbacService.createPermission(createPermissionDto);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.authRbacService.findAllPermissions();
  }

  async findPermissionById(id: string): Promise<Permission> {
    return this.authRbacService.findPermissionById(id);
  }

  // User Permission Check
  async hasPermission(
    userId: string,
    permissionCode: string,
    departmentId?: string,
  ): Promise<boolean> {
    return this.authUserService.hasPermission(
      userId,
      permissionCode,
      departmentId,
    );
  }

  async getUserPermissions(
    userId: string,
    departmentId?: string,
  ): Promise<string[]> {
    return this.authUserService.getUserPermissions(userId, departmentId);
  }

  async getUserProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    roles: string[];
    permissions: string[];
    scopedRoles: Array<{ roleCode: string; departmentId?: string | null }>;
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
  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
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
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    return this.authRbacService.assignPermissionsToRole(roleId, permissionIds);
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    return this.authRbacService.removePermissionFromRole(roleId, permissionId);
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    return this.authRbacService.addPermissionToRole(roleId, permissionId);
  }

  // User-Role Relationship Management
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<User> {
    return this.authUserService.assignRolesToUser(userId, roleIds);
  }

  async assignScopedRolesToUser(
    userId: string,
    assignments: RoleAssignmentItemDto[],
  ): Promise<User> {
    return this.authUserService.assignScopedRolesToUser(userId, assignments);
  }

  async assignScopedRolesByDto(
    userId: string,
    assignments: ScopedRoleAssignmentDto[],
  ): Promise<User> {
    return this.authUserService.assignScopedRolesToUser(userId, assignments);
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

  // Department CRUD
  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.authRbacService.createDepartment(createDepartmentDto);
  }

  async findAllDepartments(): Promise<Department[]> {
    return this.authRbacService.findAllDepartments();
  }

  async findDepartmentById(id: string): Promise<Department> {
    return this.authRbacService.findDepartmentById(id);
  }

  async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.authRbacService.updateDepartment(id, updateDepartmentDto);
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.authRbacService.deleteDepartment(id);
  }

  async isGlobalAdminUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (user.roles?.some((role) => role.code === 'ADMIN_GLOBAL')) {
      return true;
    }
    return (
      user.roleAssignments?.some(
        (assignment) => assignment.role?.code === 'ADMIN_GLOBAL',
      ) ?? false
    );
  }
}
