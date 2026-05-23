import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserService } from './auth-user.service';
import { Menu } from '../entities/menu.entity';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';

export interface MenuNode {
  id: string;
  code: string;
  label: string;
  path?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  isCollapsible: boolean;
  children: MenuNode[];
}

export interface MenuRecord {
  id: string;
  code: string;
  label: string;
  path?: string | null;
  iconKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  isCollapsible: boolean;
  adminOnly: boolean;
  permissionCodes?: string[] | null;
  permissionMatch: 'all' | 'any';
  allowedDepartments?: string[] | null;
  parentId?: string | null;
}

@Injectable()
export class AuthMenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly authUserService: AuthUserService,
  ) {}

  async getMenuForUser(
    userId: string,
    departmentId?: string,
  ): Promise<MenuNode[]> {
    const [user, permissions, menuRows] = await Promise.all([
      this.authUserService.findUserById(userId),
      this.authUserService.getUserPermissions(userId, departmentId),
      this.menuRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
    ]);

    const userDepartmentCodes =
      this.authUserService.getUserDepartmentCodes(user);
    const isAdmin = this.isGlobalAdmin(user);
    const visibleRows = menuRows.filter((menu) =>
      this.canAccessMenu(menu, {
        isAdmin,
        permissions,
        userDepartmentCodes,
      }),
    );

    return this.buildTree(visibleRows);
  }

  async findAllMenus(): Promise<MenuRecord[]> {
    const rows = await this.menuRepository.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => this.toMenuRecord(row));
  }

  async findMenuById(id: string): Promise<MenuRecord> {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    return this.toMenuRecord(menu);
  }

  async createMenu(createMenuDto: CreateMenuDto): Promise<MenuRecord> {
    if (createMenuDto.parentId) {
      await this.ensureParentExists(createMenuDto.parentId);
    }

    const menu = this.menuRepository.create({
      ...createMenuDto,
      path: createMenuDto.path ?? null,
      iconKey: createMenuDto.iconKey ?? null,
      parentId: createMenuDto.parentId ?? null,
      permissionCodes: createMenuDto.permissionCodes ?? null,
      allowedDepartments: createMenuDto.allowedDepartments ?? null,
      sortOrder: createMenuDto.sortOrder ?? 0,
      permissionMatch: createMenuDto.permissionMatch ?? 'all',
      isActive: createMenuDto.isActive ?? true,
      isCollapsible: createMenuDto.isCollapsible ?? false,
      adminOnly: createMenuDto.adminOnly ?? false,
    });

    try {
      const saved = await this.menuRepository.save(menu);
      return this.toMenuRecord(saved);
    } catch (error) {
      this.handleUniqueCodeError(error);
      throw error;
    }
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDto): Promise<MenuRecord> {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (updateMenuDto.parentId !== undefined) {
      if (updateMenuDto.parentId === id) {
        throw new ConflictException('Menu cannot be its own parent');
      }
      if (updateMenuDto.parentId) {
        await this.ensureParentExists(updateMenuDto.parentId);
      }
      menu.parentId = updateMenuDto.parentId || null;
    }

    Object.assign(menu, {
      ...(updateMenuDto.code !== undefined ? { code: updateMenuDto.code } : {}),
      ...(updateMenuDto.label !== undefined ? { label: updateMenuDto.label } : {}),
      ...(updateMenuDto.path !== undefined ? { path: updateMenuDto.path || null } : {}),
      ...(updateMenuDto.iconKey !== undefined ? { iconKey: updateMenuDto.iconKey || null } : {}),
      ...(updateMenuDto.sortOrder !== undefined ? { sortOrder: updateMenuDto.sortOrder } : {}),
      ...(updateMenuDto.isActive !== undefined ? { isActive: updateMenuDto.isActive } : {}),
      ...(updateMenuDto.isCollapsible !== undefined
        ? { isCollapsible: updateMenuDto.isCollapsible }
        : {}),
      ...(updateMenuDto.adminOnly !== undefined ? { adminOnly: updateMenuDto.adminOnly } : {}),
      ...(updateMenuDto.permissionCodes !== undefined
        ? { permissionCodes: updateMenuDto.permissionCodes }
        : {}),
      ...(updateMenuDto.permissionMatch !== undefined
        ? { permissionMatch: updateMenuDto.permissionMatch }
        : {}),
      ...(updateMenuDto.allowedDepartments !== undefined
        ? { allowedDepartments: updateMenuDto.allowedDepartments }
        : {}),
    });

    try {
      const saved = await this.menuRepository.save(menu);
      return this.toMenuRecord(saved);
    } catch (error) {
      this.handleUniqueCodeError(error);
      throw error;
    }
  }

  async deleteMenu(id: string): Promise<void> {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.menuRepository.remove(menu);
  }

  private buildTree(rows: Menu[]): MenuNode[] {
    const nodeMap = new Map<string, MenuNode>();
    const rootNodes: MenuNode[] = [];

    for (const row of rows) {
      nodeMap.set(row.id, {
        id: row.id,
        code: row.code,
        label: row.label,
        path: row.path ?? null,
        iconKey: row.iconKey ?? null,
        sortOrder: row.sortOrder,
        isCollapsible: row.isCollapsible,
        children: [],
      });
    }

    for (const row of rows) {
      const node = nodeMap.get(row.id);
      if (!node) {
        continue;
      }

      const parentId = row.parentId ?? undefined;
      if (!parentId) {
        rootNodes.push(node);
        continue;
      }

      const parentNode = nodeMap.get(parentId);
      if (!parentNode) {
        rootNodes.push(node);
        continue;
      }
      parentNode.children.push(node);
    }

    const sortNodes = (nodes: MenuNode[]) => {
      nodes.sort(
        (a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id),
      );
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(rootNodes);

    const pruneEmptyGroups = (nodes: MenuNode[]): MenuNode[] => {
      return nodes
        .map((node) => ({
          ...node,
          children: pruneEmptyGroups(node.children),
        }))
        .filter((node) => node.path || node.children.length > 0);
    };

    return pruneEmptyGroups(rootNodes);
  }

  /** WE ↔ WELDING, PD ↔ PRESS (สอดคล้อง production process gates) */
  private departmentMatchesAllowed(
    userDepartmentCode: string | undefined,
    allowedDepartments: string[],
  ): boolean {
    if (!userDepartmentCode) return false;
    const gate = this.expandDepartmentGateCodes(userDepartmentCode);
    return allowedDepartments.some((allowed) =>
      gate.some(
        (g) =>
          g.toUpperCase() === String(allowed ?? '').trim().toUpperCase(),
      ),
    );
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

  private canAccessMenu(
    menu: Menu,
    context: {
      isAdmin: boolean;
      permissions: string[];
      userDepartmentCodes: string[];
    },
  ): boolean {
    if (context.isAdmin) {
      return true;
    }

    if (menu.adminOnly) {
      return false;
    }

    if (menu.allowedDepartments?.length) {
      const ok = context.userDepartmentCodes.some((code) =>
        this.departmentMatchesAllowed(code, menu.allowedDepartments!),
      );
      if (!ok) return false;
    }

    if (!menu.permissionCodes || menu.permissionCodes.length === 0) {
      return true;
    }

    if (menu.permissionMatch === 'any') {
      return menu.permissionCodes.some((code) =>
        context.permissions.includes(code),
      );
    }

    return menu.permissionCodes.every((code) =>
      context.permissions.includes(code),
    );
  }

  private isGlobalAdmin(
    user: Awaited<ReturnType<AuthUserService['findUserById']>>,
  ): boolean {
    if (user.roles?.some((role) => role.code === 'ADMIN_GLOBAL')) {
      return true;
    }

    return (
      user.roleAssignments?.some(
        (assignment) => assignment.role?.code === 'ADMIN_GLOBAL',
      ) ?? false
    );
  }

  private toMenuRecord(menu: Menu): MenuRecord {
    return {
      id: menu.id,
      code: menu.code,
      label: menu.label,
      path: menu.path ?? null,
      iconKey: menu.iconKey ?? null,
      sortOrder: menu.sortOrder,
      isActive: menu.isActive,
      isCollapsible: menu.isCollapsible,
      adminOnly: menu.adminOnly,
      permissionCodes: menu.permissionCodes ?? null,
      permissionMatch: menu.permissionMatch,
      allowedDepartments: menu.allowedDepartments ?? null,
      parentId: menu.parentId ?? null,
    };
  }

  private async ensureParentExists(parentId: string): Promise<void> {
    const parent = await this.menuRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent menu not found');
    }
  }

  private handleUniqueCodeError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      throw new ConflictException('Menu code already exists');
    }
  }
}
