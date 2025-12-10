import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {

    const user = await this.authService.createUser(createUserDto);
    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;
    return {
      message: 'User created successfully',
      user: userResponse,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { user, permissions } = await this.authService.login(loginDto);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = user;
    
    return {
      message: 'Login successful',
      user: userResponse,
      permissions,
    };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.authService.findUserById(id);
    const { passwordHash, ...userResponse } = user;
    return userResponse;
  }

  @Get('users/:id/permissions')
  async getUserPermissions(@Param('id') id: string) {
    const permissions = await this.authService.getUserPermissions(id);
    return { permissions };
  }

  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.authService.createRole(createRoleDto);
    return {
      message: 'Role created successfully',
      role,
    };
  }

  @Get('roles')
  async getAllRoles() {
    const roles = await this.authService.findAllRoles();
    return { roles };
  }

  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    const role = await this.authService.findRoleById(id);
    return role;
  }

  @Post('permissions')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.authService.createPermission(createPermissionDto);
    return {
      message: 'Permission created successfully',
      permission,
    };
  }

  @Get('permissions')
  async getAllPermissions() {
    const permissions = await this.authService.findAllPermissions();
    return { permissions };
  }

  @Get('permissions/:id')
  async getPermissionById(@Param('id') id: string) {
    const permission = await this.authService.findPermissionById(id);
    return permission;
  }

  @Get('profile/:id')
  async getUserProfile(@Param('id') id: string) {
    const profile = await this.authService.getUserProfile(id);
    return profile;
  }

  // User CRUD Operations
  @Get('users')
  async getAllUsers() {
    const users = await this.authService.findAllUsers();
    return { users };
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.authService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully',
      user,
    };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteUser(id);
    return {
      message: 'User deleted successfully',
    };
  }

  @Patch('users/:id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    const user = await this.authService.toggleUserStatus(id);
    return {
      message: 'User status updated successfully',
      user,
    };
  }

  // Role CRUD Operations
  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.authService.updateRole(id, updateRoleDto);
    return {
      message: 'Role updated successfully',
      role,
    };
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: string) {
    await this.authService.deleteRole(id);
    return {
      message: 'Role deleted successfully',
    };
  }

  @Patch('roles/:id/toggle-status')
  async toggleRoleStatus(@Param('id') id: string) {
    const role = await this.authService.toggleRoleStatus(id);
    return {
      message: 'Role status updated successfully',
      role,
    };
  }

  @Get('roles/:id/users')
  async getRoleUsers(@Param('id') id: string) {
    const users = await this.authService.getRoleUsers(id);
    return { users };
  }

  // Permission CRUD Operations
  @Put('permissions/:id')
  async updatePermission(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.authService.updatePermission(id, updatePermissionDto);
    return {
      message: 'Permission updated successfully',
      permission,
    };
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param('id') id: string) {
    await this.authService.deletePermission(id);
    return {
      message: 'Permission deleted successfully',
    };
  }

  @Get('permissions/:id/roles')
  async getPermissionRoles(@Param('id') id: string) {
    const roles = await this.authService.getPermissionRoles(id);
    return { roles };
  }

  @Get('permissions/modules/:module')
  async getPermissionsByModule(@Param('module') module: string) {
    const permissions = await this.authService.getPermissionsByModule(module);
    return { permissions };
  }

  @Get('modules')
  async getAllModules() {
    const modules = await this.authService.getAllModules();
    return { modules };
  }

  // Role-Permission Relationship Management
  @Put('roles/:id/permissions')
  async assignPermissionsToRole(@Param('id') roleId: string, @Body() assignPermissionsDto: AssignPermissionsDto) {
    const role = await this.authService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIds);
    return {
      message: 'Permissions assigned to role successfully',
      role,
    };
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionFromRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    const role = await this.authService.removePermissionFromRole(roleId, permissionId);
    return {
      message: 'Permission removed from role successfully',
      role,
    };
  }

  @Post('roles/:roleId/permissions/:permissionId')
  async addPermissionToRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    const role = await this.authService.addPermissionToRole(roleId, permissionId);
    return {
      message: 'Permission added to role successfully',
      role,
    };
  }

  // User-Role Relationship Management
  @Put('users/:id/roles')
  async assignRolesToUser(@Param('id') userId: string, @Body() assignRolesDto: AssignRolesDto) {
    const user = await this.authService.assignRolesToUser(userId, assignRolesDto.roleIds);
    return {
      message: 'Roles assigned to user successfully',
      user,
    };
  }

  @Delete('users/:userId/roles/:roleId')
  async removeRoleFromUser(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    const user = await this.authService.removeRoleFromUser(userId, roleId);
    return {
      message: 'Role removed from user successfully',
      user,
    };
  }

  @Post('users/:userId/roles/:roleId')
  async addRoleToUser(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    const user = await this.authService.addRoleToUser(userId, roleId);
    return {
      message: 'Role added to user successfully',
      user,
    };
  }

  // Bulk Query Operations
  @Get('roles/:id/users-with-role')
  async getUsersWithRole(@Param('id') roleId: string) {
    const users = await this.authService.getUsersWithRole(roleId);
    return { users };
  }

  @Get('permissions/:id/roles-with-permission')
  async getRolesWithPermission(@Param('id') permissionId: string) {
    const roles = await this.authService.getRolesWithPermission(permissionId);
    return { roles };
  }
}