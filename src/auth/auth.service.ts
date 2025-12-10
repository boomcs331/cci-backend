import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // User Management
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, roleIds, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      ...userData,
    });

    // Add roles if provided
    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({ 
        id: In(roleIds) 
      });
      user.roles = roles;
    }

    return await this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return user;
  }

  async login(loginDto: LoginDto): Promise<{ user: User; permissions: string[] }> {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);

    // Get all permissions from user's roles
    const permissions = user.roles.reduce((acc, role) => {
      role.permissions.forEach(permission => {
        if (!acc.includes(permission.code)) {
          acc.push(permission.code);
        }
      });
      return acc;
    }, [] as string[]);

    return { user, permissions };
  }

  // Role Management
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { code, permissionIds, ...roleData } = createRoleDto;

    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({ where: { code } });
    if (existingRole) {
      throw new ConflictException('Role code already exists');
    }

    // Create role
    const role = this.roleRepository.create({ code, ...roleData });

    // Add permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({ 
        id: In(permissionIds) 
      });
      role.permissions = permissions;
    }

    return await this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['permissions'],
    });
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

  // Permission Management
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { code } = createPermissionDto;

    // Check if permission already exists
    const existingPermission = await this.permissionRepository.findOne({ where: { code } });
    if (existingPermission) {
      throw new ConflictException('Permission code already exists');
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find();
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

  // User Permission Check
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    
    return user.roles.some(role =>
      role.permissions.some(permission => permission.code === permissionCode)
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.findUserById(userId);
    
    const permissions = user.roles.reduce((acc, role) => {
      role.permissions.forEach(permission => {
        if (!acc.includes(permission.code)) {
          acc.push(permission.code);
        }
      });
      return acc;
    }, [] as string[]);

    return permissions;
  }

  async getUserProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    roles: string[];
    permissions: string[];
  }> {
    const user = await this.findUserById(userId);
    
    // Extract role codes
    const roles = user.roles.map(role => role.code);
    
    // Extract permission codes
    const permissions = user.roles.reduce((acc, role) => {
      role.permissions.forEach(permission => {
        if (!acc.includes(permission.code)) {
          acc.push(permission.code);
        }
      });
      return acc;
    }, [] as string[]);

    // Remove password hash from user object
    const { passwordHash, ...userProfile } = user;

    return {
      user: userProfile,
      roles,
      permissions,
    };
  }

  // Additional User CRUD Operations
  async findAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      relations: ['roles', 'roles.permissions'],
    });

    // Remove password hash from all users
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  async updateUser(id: string, updateUserDto: any): Promise<User> {
    const { roleIds, ...updateData } = updateUserDto;

    // Find existing user
    const user = await this.findUserById(id);

    // Update basic user data
    Object.assign(user, updateData);

    // Update roles if provided
    if (roleIds && roleIds.length >= 0) {
      if (roleIds.length === 0) {
        user.roles = [];
      } else {
        const roles = await this.roleRepository.findBy({ 
          id: In(roleIds) 
        });
        user.roles = roles;
      }
    }

    const updatedUser = await this.userRepository.save(user);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    await this.userRepository.remove(user);
  }

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.findUserById(id);
    user.isActive = !user.isActive;
    
    const updatedUser = await this.userRepository.save(user);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  // Role CRUD Operations
  async updateRole(id: string, updateRoleDto: any): Promise<Role> {
    const { permissionIds, ...updateData } = updateRoleDto;

    // Find existing role
    const role = await this.findRoleById(id);

    // Check if code is being updated and if it already exists
    if (updateData.code && updateData.code !== role.code) {
      const existingRole = await this.roleRepository.findOne({ 
        where: { code: updateData.code } 
      });
      if (existingRole) {
        throw new ConflictException('Role code already exists');
      }
    }

    // Update basic role data
    Object.assign(role, updateData);

    // Update permissions if provided
    if (permissionIds && permissionIds.length >= 0) {
      if (permissionIds.length === 0) {
        role.permissions = [];
      } else {
        const permissions = await this.permissionRepository.findBy({ 
          id: In(permissionIds) 
        });
        role.permissions = permissions;
      }
    }

    return await this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    
    // Check if role is system role
    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }

    await this.roleRepository.remove(role);
  }

  async toggleRoleStatus(id: string): Promise<Role> {
    const role = await this.findRoleById(id);
    
    // Check if role is system role
    if (role.isSystem) {
      throw new ConflictException('Cannot modify system role status');
    }

    // Toggle isSystem status (or you can add isActive field to Role entity)
    role.isSystem = !role.isSystem;
    
    return await this.roleRepository.save(role);
  }

  async getRoleUsers(id: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Remove password hash from all users
    return role.users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  // Permission CRUD Operations
  async updatePermission(id: string, updatePermissionDto: any): Promise<Permission> {
    // Find existing permission
    const permission = await this.findPermissionById(id);

    // Check if code is being updated and if it already exists
    if (updatePermissionDto.code && updatePermissionDto.code !== permission.code) {
      const existingPermission = await this.permissionRepository.findOne({ 
        where: { code: updatePermissionDto.code } 
      });
      if (existingPermission) {
        throw new ConflictException('Permission code already exists');
      }
    }

    // Update permission data
    Object.assign(permission, updatePermissionDto);

    return await this.permissionRepository.save(permission);
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    
    // Check if permission is being used by any roles
    const permissionWithRoles = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (permissionWithRoles && permissionWithRoles.roles.length > 0) {
      throw new ConflictException('Cannot delete permission that is assigned to roles');
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
    return await this.permissionRepository.find({
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

    return permissions.map(p => p.module).filter(Boolean);
  }

  // Role-Permission Relationship Management
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);
    
    if (permissionIds.length === 0) {
      role.permissions = [];
    } else {
      const permissions = await this.permissionRepository.findBy({ 
        id: In(permissionIds) 
      });
      
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions not found');
      }
      
      role.permissions = permissions;
    }

    return await this.roleRepository.save(role);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findRoleById(roleId);
    
    role.permissions = role.permissions.filter(permission => permission.id !== permissionId);
    
    return await this.roleRepository.save(role);
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permission = await this.findPermissionById(permissionId);
    
    // Check if permission is already assigned
    const isAlreadyAssigned = role.permissions.some(p => p.id === permissionId);
    if (isAlreadyAssigned) {
      throw new ConflictException('Permission already assigned to this role');
    }
    
    role.permissions.push(permission);
    
    return await this.roleRepository.save(role);
  }

  // User-Role Relationship Management
  async assignRolesToUser(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findUserById(userId);
    
    if (roleIds.length === 0) {
      user.roles = [];
    } else {
      const roles = await this.roleRepository.findBy({ 
        id: In(roleIds) 
      });
      
      if (roles.length !== roleIds.length) {
        throw new NotFoundException('Some roles not found');
      }
      
      user.roles = roles;
    }

    const updatedUser = await this.userRepository.save(user);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findUserById(userId);
    
    user.roles = user.roles.filter(role => role.id !== roleId);
    
    const updatedUser = await this.userRepository.save(user);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findUserById(userId);
    const role = await this.findRoleById(roleId);
    
    // Check if role is already assigned
    const isAlreadyAssigned = user.roles.some(r => r.id === roleId);
    if (isAlreadyAssigned) {
      throw new ConflictException('Role already assigned to this user');
    }
    
    user.roles.push(role);
    
    const updatedUser = await this.userRepository.save(user);
    
    // Remove password hash from response
    const { passwordHash, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  // Bulk operations
  async getUsersWithRole(roleId: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Remove password hash from all users
    return role.users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
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
}