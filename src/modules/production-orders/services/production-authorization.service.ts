import { Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { ProductionOrder, ProductionProcess } from '../entities';
import { AuthUserService } from '../../auth/services/auth-user.service';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class ProductionAuthorizationService {
  constructor(private readonly authUserService: AuthUserService) {}

  /** ค่า operator ที่เป็นตัวเลขล้วน = user id จาก client เก่า — แปลงเป็น username (login) */
  looksLikeUserId(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  async resolveOperatorLogin(
    dtoOperator?: string,
    user?: User | null,
  ): Promise<string> {
    const fromUser = user?.username?.trim();
    if (fromUser) return fromUser;

    const raw = dtoOperator?.trim();
    if (!raw) return 'scanner';

    if (this.looksLikeUserId(raw)) {
      try {
        const u = await this.authUserService.findUserById(raw);
        const login = u.username?.trim();
        if (login) return login;
      } catch {
        /* keep raw */
      }
    }
    return raw;
  }

  async operatorLoginFromStored(
    stored: string | null | undefined,
  ): Promise<string | null> {
    const raw = stored?.trim();
    if (!raw) return null;
    if (!this.looksLikeUserId(raw)) return raw;
    try {
      const u = await this.authUserService.findUserById(raw);
      return u.username?.trim() || raw;
    } catch {
      return raw;
    }
  }

  async enrichOrderTrackingOperators(order: ProductionOrder): Promise<void> {
    const cache = new Map<string, string>();
    for (const lot of order.lots ?? []) {
      for (const t of lot.tracking ?? []) {
        const op = t.operator?.trim();
        if (!op || !this.looksLikeUserId(op) || cache.has(op)) continue;
        const login = await this.operatorLoginFromStored(op);
        if (login) cache.set(op, login);
      }
    }
    for (const lot of order.lots ?? []) {
      for (const t of lot.tracking ?? []) {
        const op = t.operator?.trim();
        if (op && cache.has(op)) t.operator = cache.get(op)!;
      }
    }
  }

  userIsAdminGlobal(user: User | null | undefined): boolean {
    if (!user) return false;
    const fromDirect = user.roles?.some((r) => r.code === 'ADMIN_GLOBAL');
    if (fromDirect) return true;
    return (
      user.roleAssignments?.some((a) => a.role?.code === 'ADMIN_GLOBAL') ??
      false
    );
  }

  /** รหัสแผนกที่ใช้เทียบ allowed_department_codes (รองรับ WE↔WELDING, PD↔PRESS) */
  departmentCodesForGate(deptCode: string): string[] {
    const trimmed = deptCode.trim();
    const upper = trimmed.toUpperCase();
    const codes = new Set<string>([trimmed, upper]);
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

  applyDeptProcessGate(
    qb: SelectQueryBuilder<any>,
    gateCodes: string[],
    processAlias = 'process',
  ): void {
    if (!gateCodes.length) {
      qb.andWhere('1 = 0');
      return;
    }
    qb.andWhere(
      new Brackets((sub) => {
        sub.where(`${processAlias}.allowedDepartmentCodes IS NULL`);
        gateCodes.forEach((code, idx) => {
          const param = `deptGate${idx}`;
          sub.orWhere(
            `:${param} = ANY(${processAlias}.allowedDepartmentCodes)`,
            { [param]: code },
          );
        });
      }),
    );
  }

  deptAllowedForProcess(
    process: ProductionProcess | null | undefined,
    gateCodes: string[],
  ): boolean {
    if (!process) return false;
    const allowed = process.allowedDepartmentCodes;
    if (!allowed?.length) return true;
    if (!gateCodes.length) return false;
    return allowed.some((a) =>
      gateCodes.some(
        (g) => g.toUpperCase() === String(a ?? '').trim().toUpperCase(),
      ),
    );
  }

  canUserActOnProcess(
    process: ProductionProcess,
    user: User | null,
    isGlobal: boolean,
  ): boolean {
    if (isGlobal) return true;
    if (!user) return false;
    const gateCodes = this.authUserService.expandedGateCodesForUser(user);
    return this.deptAllowedForProcess(process, gateCodes);
  }
}
