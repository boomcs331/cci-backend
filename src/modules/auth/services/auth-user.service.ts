import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { RoleAssignmentItemDto } from '../dto/assign-roles.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Department } from '../entities/department.entity';
import { Role, RoleScopeType } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { UserRoleAssignment } from '../entities/user-role-assignment.entity';
import { throwMappedUniqueConstraintError } from '../utils/auth-error.util';

@Injectable()
export class AuthUserService {
  private readonly userRelations = [
    'department',
    'roles',
    'roles.permissions',
    'roleAssignments',
    'roleAssignments.role',
    'roleAssignments.role.permissions',
    'roleAssignments.department',
  ] as const;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepository: Repository<UserRoleAssignment>,
  ) {}

  private getUniquePermissionCodes(
    user: User,
    departmentId?: string,
  ): string[] {
    const permissionSet = new Set<string>();

    user.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissionSet.add(permission.code);
      });
    });

    user.roleAssignments?.forEach((assignment) => {
      const isGlobalRole = assignment.role?.scopeType === RoleScopeType.GLOBAL;
      const isMatchingDepartment = Boolean(
        departmentId &&
        assignment.departmentId &&
        assignment.departmentId === departmentId,
      );

      if (departmentId && !isGlobalRole && !isMatchingDepartment) {
        return;
      }

      assignment.role?.permissions?.forEach((permission) => {
        permissionSet.add(permission.code);
      });
    });

    return [...permissionSet];
  }

  private sanitizeUser<T extends { passwordHash?: string }>(
    user: T,
  ): Omit<T, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private sanitizeUsers<T extends { passwordHash?: string }>(
    users: T[],
  ): Omit<T, 'passwordHash'>[] {
    return users.map((user) => this.sanitizeUser(user));
  }

  private async validateDepartment(departmentId?: string): Promise<void> {
    if (!departmentId) {
      return;
    }

    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
  }

  private async setScopedRoleAssignments(
    userId: string,
    assignments: RoleAssignmentItemDto[],
  ): Promise<void> {
    await this.userRoleAssignmentRepository.delete({ userId });

    if (!assignments.length) {
      return;
    }

    const uniqueRoleIds = [
      ...new Set(assignments.map((assignment) => assignment.roleId)),
    ];
    const roles = await this.roleRepository.findBy({ id: In(uniqueRoleIds) });
    if (roles.length !== uniqueRoleIds.length) {
      throw new NotFoundException('Some roles not found');
    }

    const roleMap = new Map(roles.map((role) => [role.id, role]));
    const validatedAssignments: UserRoleAssignment[] = [];

    for (const assignment of assignments) {
      const role = roleMap.get(assignment.roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      if (
        role.scopeType === RoleScopeType.DEPARTMENT &&
        !assignment.departmentId
      ) {
        throw new ConflictException(
          `Role ${role.code} requires department scope`,
        );
      }

      if (assignment.departmentId) {
        await this.validateDepartment(assignment.departmentId);
      }

      validatedAssignments.push(
        this.userRoleAssignmentRepository.create({
          userId,
          roleId: role.id,
          departmentId: assignment.departmentId ?? null,
        }),
      );
    }

    await this.userRoleAssignmentRepository.save(validatedAssignments);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, roleIds, departmentId, ...userData } =
      createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    await this.validateDepartment(departmentId);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      departmentId: departmentId ?? null,
      ...userData,
    });

    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    const savedUser = await this.userRepository.save(user);
    return this.findUserById(savedUser.id);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [...this.userRelations],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [...this.userRelations],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: [...this.userRelations],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, isActive: true },
      relations: [...this.userRelations],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    return user;
  }

  async findAllUsers(): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.roleAssignments', 'roleAssignments')
      .leftJoinAndSelect('roleAssignments.role', 'assignmentRole')
      .leftJoinAndSelect('assignmentRole.permissions', 'assignmentPermissions')
      .leftJoinAndSelect('roleAssignments.department', 'assignmentDepartment')
      .orderBy('COALESCE(user.updatedAt, user.createdAt)', 'DESC')
      .getMany();
    return this.sanitizeUsers(users) as User[];
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleIds, departmentId, ...updateData } = updateUserDto;
    const user = await this.findUserById(id);
    Object.assign(user, {
      ...updateData,
      ...(departmentId !== undefined
        ? { departmentId: departmentId || null }
        : {}),
    });

    if (roleIds && roleIds.length >= 0) {
      user.roles =
        roleIds.length === 0
          ? []
          : await this.roleRepository.findBy({ id: In(roleIds) });
    }

    if (departmentId !== undefined) {
      await this.validateDepartment(departmentId || undefined);
    }

    try {
      await this.userRepository.save(user);
      const updatedUser = await this.findUserById(id);
      return this.sanitizeUser(updatedUser) as User;
    } catch (error) {
      throwMappedUniqueConstraintError(
        error,
        {
          users_username_key: 'Username already exists',
          users_email_key: 'Email already exists',
        },
        'Duplicate user data detected',
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    await this.userRepository.remove(user);
  }

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.findUserById(id);
    user.isActive = !user.isActive;
    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser) as User;
  }

  async assignRolesToUser(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findUserById(userId);
    if (roleIds.length === 0) {
      user.roles = [];
    } else {
      const roles = await this.roleRepository.findBy({ id: In(roleIds) });
      if (roles.length !== roleIds.length) {
        throw new NotFoundException('Some roles not found');
      }
      user.roles = roles;
    }
    await this.userRepository.save(user);
    const updatedUser = await this.findUserById(userId);
    return this.sanitizeUser(updatedUser) as User;
  }

  async assignScopedRolesToUser(
    userId: string,
    assignments: RoleAssignmentItemDto[],
  ): Promise<User> {
    await this.findUserById(userId);
    await this.setScopedRoleAssignments(userId, assignments);
    const updatedUser = await this.findUserById(userId);
    return this.sanitizeUser(updatedUser) as User;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findUserById(userId);
    user.roles = user.roles.filter((role) => role.id !== roleId);
    await this.userRepository.save(user);
    const updatedUser = await this.findUserById(userId);
    return this.sanitizeUser(updatedUser) as User;
  }

  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findUserById(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const isAlreadyAssigned = user.roles.some((r) => r.id === roleId);
    if (isAlreadyAssigned) {
      throw new ConflictException('Role already assigned to this user');
    }
    user.roles.push(role);
    await this.userRepository.save(user);
    const updatedUser = await this.findUserById(userId);
    return this.sanitizeUser(updatedUser) as User;
  }

  async hasPermission(
    userId: string,
    permissionCode: string,
    departmentId?: string,
  ): Promise<boolean> {
    const user = await this.findUserById(userId);
    const permissions = this.getUniquePermissionCodes(user, departmentId);
    return permissions.includes(permissionCode);
  }

  async getUserPermissions(
    userId: string,
    departmentId?: string,
  ): Promise<string[]> {
    const user = await this.findUserById(userId);
    return this.getUniquePermissionCodes(user, departmentId);
  }

  async getUserProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    roles: string[];
    permissions: string[];
    scopedRoles: Array<{ roleCode: string; departmentId?: string | null }>;
  }> {
    const user = await this.findUserById(userId);
    return {
      user: this.sanitizeUser(user),
      roles: user.roles.map((role) => role.code),
      permissions: this.getUniquePermissionCodes(user),
      scopedRoles: (user.roleAssignments ?? []).map((assignment) => ({
        roleCode: assignment.role?.code ?? '',
        departmentId: assignment.departmentId ?? null,
      })),
    };
  }

  async getUsersWithRole(roleId: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .leftJoin('user.roleAssignments', 'roleAssignment')
      .where('role.id = :roleId', { roleId })
      .orWhere('roleAssignment.roleId = :roleId', { roleId })
      .getMany();

    return this.sanitizeUsers(users) as User[];
  }
}
