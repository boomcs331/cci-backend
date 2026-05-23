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
import { UserDepartment } from '../entities/user-department.entity';
import { throwMappedUniqueConstraintError } from '../utils/auth-error.util';

@Injectable()
export class AuthUserService {
  private readonly userRelations = [
    'department',
    'userDepartments',
    'userDepartments.department',
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
    @InjectRepository(UserDepartment)
    private readonly userDepartmentRepository: Repository<UserDepartment>,
  ) {}

  /** รวม department id ทั้งหมดของผู้ใช้ */
  collectUserDepartmentIds(user: User): Set<string> {
    const ids = new Set<string>();
    if (user.departmentId) ids.add(String(user.departmentId));
    user.userDepartments?.forEach((ud) => {
      if (ud.departmentId) ids.add(String(ud.departmentId));
    });
    return ids;
  }

  getDepartmentsForUser(user: User): Department[] {
    const map = new Map<string, Department>();
    if (user.department) map.set(String(user.department.id), user.department);
    user.userDepartments?.forEach((ud) => {
      if (ud.department) map.set(String(ud.department.id), ud.department);
    });
    const list = [...map.values()];
    const primaryId = user.departmentId ? String(user.departmentId) : null;
    list.sort((a, b) => {
      if (primaryId && String(a.id) === primaryId) return -1;
      if (primaryId && String(b.id) === primaryId) return 1;
      return (a.code ?? '').localeCompare(b.code ?? '');
    });
    return list;
  }

  getUserDepartmentCodes(user: User): string[] {
    return this.getDepartmentsForUser(user)
      .map((d) => d.code)
      .filter((c): c is string => Boolean(c?.trim()));
  }

  async getUserDepartmentCodesByUserId(userId: string): Promise<string[]> {
    const user = await this.findUserById(userId);
    return this.getUserDepartmentCodes(user);
  }

  private expandDepartmentGateCodes(deptCode: string): string[] {
    const trimmed = deptCode.trim();
    const upper = trimmed.toUpperCase();
    const codes = new Set([trimmed, upper]);
    if (upper === 'WE' || upper === 'WELDING') {
      codes.add('WE');
      codes.add('WELDING');
    }
    if (upper === 'PD' || upper === 'PRESS' || upper === 'PRESS_FIT') {
      codes.add('PD');
      codes.add('PRESS');
      codes.add('PRESS_FIT');
    }
    return [...codes];
  }

  /** รวม gate codes จากทุกแผนกของผู้ใช้ (สำหรับ production process filter) */
  expandedGateCodesForUser(user: User | null): string[] {
    if (!user) return [];
    const merged = new Set<string>();
    for (const code of this.getUserDepartmentCodes(user)) {
      for (const g of this.expandDepartmentGateCodes(code)) {
        merged.add(g);
      }
    }
    return [...merged];
  }

  /** gate codes จากแผนกที่เลือกใช้งาน (x-department-id) — ไม่รวมแผนกอื่น */
  resolveProductionGateForActiveDepartment(
    user: User | null,
    activeDepartmentId?: string,
  ): { gateCodes: string[]; departmentCode: string | null; departmentName: string | null } {
    if (!user) {
      return { gateCodes: [], departmentCode: null, departmentName: null };
    }

    const depts = this.getDepartmentsForUser(user);
    let dept = activeDepartmentId
      ? depts.find((d) => String(d.id) === String(activeDepartmentId))
      : undefined;
    if (!dept && user.department) {
      dept = user.department;
    }

    if (!dept?.code?.trim()) {
      return { gateCodes: [], departmentCode: null, departmentName: null };
    }

    return {
      gateCodes: this.expandDepartmentGateCodes(dept.code),
      departmentCode: dept.code,
      departmentName: dept.name ?? null,
    };
  }

  private async syncUserDepartments(
    userId: string,
    departmentIds: string[] | undefined,
    primaryDepartmentId?: string | null,
  ): Promise<void> {
    await this.userDepartmentRepository.delete({ userId });

    const unique = [...new Set((departmentIds ?? []).filter(Boolean))];
    if (!unique.length) return;

    const primary =
      primaryDepartmentId && unique.includes(primaryDepartmentId)
        ? primaryDepartmentId
        : unique[0];

    for (const departmentId of unique) {
      await this.validateDepartment(departmentId);
      await this.userDepartmentRepository.save(
        this.userDepartmentRepository.create({
          userId,
          departmentId,
          isPrimary: String(departmentId) === String(primary),
        }),
      );
    }
  }

  private getUniquePermissionCodes(
    user: User,
    _departmentId?: string,
  ): string[] {
    const permissionSet = new Set<string>();
    const userDeptIds = this.collectUserDepartmentIds(user);

    user.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissionSet.add(permission.code);
      });
    });

    user.roleAssignments?.forEach((assignment) => {
      const role = assignment.role;
      if (!role) return;

      if (role.scopeType === RoleScopeType.GLOBAL) {
        role.permissions?.forEach((permission) => {
          permissionSet.add(permission.code);
        });
        return;
      }

      const assignDeptId =
        assignment.departmentId ?? assignment.department?.id ?? null;
      if (assignDeptId && userDeptIds.has(String(assignDeptId))) {
        role.permissions?.forEach((permission) => {
          permissionSet.add(permission.code);
        });
      }
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
    const {
      username,
      email,
      password,
      roleIds,
      departmentId,
      departmentIds,
      ...userData
    } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const deptList =
      departmentIds?.length ? departmentIds : departmentId ? [departmentId] : [];
    const primaryDept = departmentId ?? deptList[0] ?? null;
    if (primaryDept) await this.validateDepartment(primaryDept);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      departmentId: primaryDept,
      ...userData,
    });

    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    const savedUser = await this.userRepository.save(user);
    await this.syncUserDepartments(savedUser.id, deptList, primaryDept);
    const full = await this.findUserById(savedUser.id);
    return { ...full, departments: this.getDepartmentsForUser(full) } as User;
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [...this.userRelations],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      ...user,
      departments: this.getDepartmentsForUser(user),
    } as User;
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
      .leftJoinAndSelect('user.userDepartments', 'userDepartments')
      .leftJoinAndSelect('userDepartments.department', 'userDepartmentsDept')
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
    const { roleIds, departmentId, departmentIds, ...updateData } =
      updateUserDto;
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [...this.userRelations],
    });
    if (!user) throw new NotFoundException('User not found');

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

    const deptList =
      departmentIds !== undefined
        ? departmentIds
        : departmentId !== undefined
          ? departmentId
            ? [departmentId]
            : []
          : undefined;
    const primaryDept =
      departmentId !== undefined
        ? departmentId || null
        : user.departmentId ?? null;

    try {
      await this.userRepository.save(user);
      if (deptList !== undefined) {
        await this.syncUserDepartments(id, deptList, primaryDept);
      }
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

  /**
   * ชื่อผู้ทำรายการ — จาก JWT (ถ้ามี) หรือ header x-user-id → lookup username ใน DB
   * (apiFetch ส่ง x-user-id ไม่ได้ตั้ง req.user)
   */
  async resolveUsernameFromRequest(req: {
    user?: { id?: string | number; username?: string };
    headers?: Record<string, string | string[] | undefined>;
  }): Promise<string> {
    const direct = req.user?.username?.trim();
    if (direct) return direct;

    const rawUsername = req.headers?.['x-username'];
    const headerUsername = Array.isArray(rawUsername)
      ? rawUsername[0]
      : rawUsername;
    if (typeof headerUsername === 'string' && headerUsername.trim()) {
      return headerUsername.trim();
    }

    const rawUserId = req.headers?.['x-user-id'];
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    if (userId) {
      try {
        const user = await this.findUserById(String(userId));
        const un = user.username?.trim();
        if (un) return un;
      } catch {
        // user not found
      }
    }

    return 'system';
  }
}
