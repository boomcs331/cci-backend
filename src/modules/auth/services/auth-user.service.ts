import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { throwMappedUniqueConstraintError } from '../utils/auth-error.util';

@Injectable()
export class AuthUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  private getUniquePermissionCodes(user: User): string[] {
    const permissionSet = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissionSet.add(permission.code);
      });
    });
    return [...permissionSet];
  }

  private sanitizeUser<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private sanitizeUsers<T extends { passwordHash?: string }>(users: T[]): Omit<T, 'passwordHash'>[] {
    return users.map((user) => this.sanitizeUser(user));
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, roleIds, ...userData } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      ...userData,
    });

    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepository.findBy({ id: In(roleIds) });
    }

    return this.userRepository.save(user);
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

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    return user;
  }

  async findAllUsers(): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .orderBy('COALESCE(user.updatedAt, user.createdAt)', 'DESC')
      .getMany();
    return this.sanitizeUsers(users) as User[];
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleIds, ...updateData } = updateUserDto;
    const user = await this.findUserById(id);
    Object.assign(user, updateData);

    if (roleIds && roleIds.length >= 0) {
      user.roles = roleIds.length === 0 ? [] : await this.roleRepository.findBy({ id: In(roleIds) });
    }

    try {
      const updatedUser = await this.userRepository.save(user);
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
    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser) as User;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findUserById(userId);
    user.roles = user.roles.filter((role) => role.id !== roleId);
    const updatedUser = await this.userRepository.save(user);
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
    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser) as User;
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    return user.roles.some((role) =>
      role.permissions.some((permission) => permission.code === permissionCode),
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.findUserById(userId);
    return this.getUniquePermissionCodes(user);
  }

  async getUserProfile(userId: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    roles: string[];
    permissions: string[];
  }> {
    const user = await this.findUserById(userId);
    return {
      user: this.sanitizeUser(user),
      roles: user.roles.map((role) => role.code),
      permissions: this.getUniquePermissionCodes(user),
    };
  }

  async getUsersWithRole(roleId: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.sanitizeUsers(role.users) as User[];
  }
}
