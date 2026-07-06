import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AssignRolesDto } from '../dto/assign-roles.dto';
import { AssignScopedRolesDto } from '../dto/assign-scoped-roles.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthUsersController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile/:id')
  async getUserProfile(@Param('id') id: string) {
    return this.authService.getUserProfile(id);
  }

  @Get('users')
  async getAllUsers() {
    const users = await this.authService.findAllUsers();
    return withCollection('users', users);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.authService.findUserById(id);
  }

  @Get('users/:id/permissions')
  async getUserPermissions(
    @Param('id') id: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const permissions = await this.authService.getUserPermissions(
      id,
      departmentId,
    );
    return withCollection('permissions', permissions);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.authService.updateUser(id, updateUserDto);
    return withMessage('User updated successfully', 'user', user);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Patch('users/:id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    const user = await this.authService.toggleUserStatus(id);
    return withMessage('User status updated successfully', 'user', user);
  }

  @Put('users/:id/roles')
  async assignRolesToUser(
    @Param('id') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    const user = assignRolesDto.assignments
      ? await this.authService.assignScopedRolesToUser(
          userId,
          assignRolesDto.assignments,
        )
      : await this.authService.assignRolesToUser(
          userId,
          assignRolesDto.roleIds ?? [],
        );
    return withMessage('Roles assigned to user successfully', 'user', user);
  }

  @Put('users/:id/scoped-roles')
  async assignScopedRolesToUser(
    @Param('id') userId: string,
    @Body() assignScopedRolesDto: AssignScopedRolesDto,
  ) {
    const user = await this.authService.assignScopedRolesByDto(
      userId,
      assignScopedRolesDto.assignments,
    );
    return withMessage(
      'Scoped roles assigned to user successfully',
      'user',
      user,
    );
  }

  @Delete('users/:userId/roles/:roleId')
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.authService.removeRoleFromUser(userId, roleId);
    return withMessage('Role removed from user successfully', 'user', user);
  }

  @Post('users/:userId/roles/:roleId')
  async addRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    const user = await this.authService.addRoleToUser(userId, roleId);
    return withMessage('Role added to user successfully', 'user', user);
  }
}
