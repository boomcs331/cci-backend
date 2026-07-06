import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { ProductionLot, ProductionProcess, ProductionLotTracking } from '../entities';
import { ProductionAuthorizationService } from './production-authorization.service';

@Injectable()
export class ProductionTrackingService {
  constructor(private readonly authorizationService: ProductionAuthorizationService) {}

  async buildLotStepTracePayload(
    lot: ProductionLot,
    childLots: ProductionLot[] = [],
    resolveOrderedProcesses: (manager: EntityManager, productId: number) => Promise<ProductionProcess[]>,
    manager: EntityManager,
  ) {
    const orderedProcesses = await resolveOrderedProcesses(
      manager,
      lot.order.productId,
    );

    const trackingByProcess = new Map(
      (lot.tracking ?? []).map((t) => [t.processId, t]),
    );

    const steps = await Promise.all(
      orderedProcesses.map(async (proc, idx) => {
        const t = trackingByProcess.get(proc.id);
        let stepStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' =
          'pending';
        if (t?.status === 'IN_PROGRESS') stepStatus = 'in_progress';
        else if (t?.status === 'COMPLETED') stepStatus = 'completed';
        else if (t?.status === 'REJECTED') stepStatus = 'rejected';

        let qtyIn = t?.quantityIn != null ? Number(t.quantityIn) : null;
        let qtyOut = t?.quantityOut != null ? Number(t.quantityOut) : null;

        if (t && qtyIn == null) {
          qtyIn = Number(lot.quantity);
        }
        if (t?.status === 'COMPLETED' && qtyOut == null) {
          qtyOut = Number(lot.quantity);
        }

        const operator =
          t?.operator != null
            ? (await this.authorizationService.operatorLoginFromStored(t.operator)) ?? t.operator
            : null;

        return {
          stepOrder: idx + 1,
          processId: proc.id,
          processCode: proc.processCode,
          processName: proc.processName,
          status: stepStatus,
          quantityIn: qtyIn,
          quantityOut: qtyOut,
          operator,
          startTime: t?.startTime ?? null,
          endTime: t?.endTime ?? null,
          remarks: t?.remarks ?? null,
        };
      }),
    );

    return {
      lotId: lot.id,
      lotNo: lot.lotNo,
      qrCode: lot.qrCode,
      lotQuantity: Number(lot.quantity),
      lotStatus: lot.status,
      lotCreatedAt: lot.createDate ?? null,
      orderNo: lot.order.orderNo,
      productId: lot.order.productId,
      productCode: lot.order.product?.productCode ?? null,
      productName: lot.order.product?.productName ?? null,
      unit: 'PCS',
      steps,
      splitChildren: childLots.map((c) => ({
        lotNo: c.lotNo,
        qrCode: c.qrCode,
        quantity: Number(c.quantity),
        status: c.status,
        splitReason: c.splitReason ?? null,
      })),
    };
  }

  /** Clone COMPLETED steps before current process from parent → child after split. */
  async inheritPriorProcessTrackingFromParent(
    manager: EntityManager,
    parentLot: ProductionLot,
    childLotId: number,
    childQuantity: number,
    orderedProcesses: ProductionProcess[],
    currentProcessId: number,
  ): Promise<void> {
    const currentIdx = orderedProcesses.findIndex(
      (p) => p.id === currentProcessId,
    );
    if (currentIdx <= 0) return;

    const priorProcessIds = orderedProcesses
      .slice(0, currentIdx)
      .map((p) => p.id);

    const parentRows = await manager.find(ProductionLotTracking, {
      where: {
        lotId: parentLot.id,
        processId: In(priorProcessIds),
        status: 'COMPLETED',
      },
      order: { id: 'ASC' },
    });

    for (const pt of parentRows) {
      const exists = await manager.findOne(ProductionLotTracking, {
        where: { lotId: childLotId, processId: pt.processId },
      });
      if (exists) continue;

      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: childLotId,
          processId: pt.processId,
          startTime: pt.startTime ?? pt.createDate,
          endTime: pt.endTime ?? pt.startTime ?? new Date(),
          status: 'COMPLETED',
          operator: pt.operator,
          quantityIn: childQuantity,
          quantityOut: childQuantity,
          remarks: this.appendSplitLineageRemark(pt.remarks, parentLot.lotNo),
        }),
      );
    }
  }

  private appendSplitLineageRemark(
    prior: string | null | undefined,
    parentLotNo: string,
  ): string {
    const tag = `สืบทอดจาก ${parentLotNo} (split)`;
    const base = prior?.trim();
    if (!base) return tag;
    if (base.includes(parentLotNo)) return base;
    return `${base} · ${tag}`;
  }

  normalizeLotLookupCode(input: string): string {
    const raw = (input ?? '').trim();
    if (!raw) return raw;
    // Some scanners may send full URLs or include query strings.
    const noQuery = raw.split('?')[0] ?? raw;
    const parts = noQuery.split('/').filter(Boolean);
    return (parts[parts.length - 1] ?? noQuery).trim();
  }
}
