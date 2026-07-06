import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProductionLot, ProductionProcess, ProductionOrder, ProductionLotTracking } from '../entities';
import { ProductStockService } from '../../products/product-stock.service';

@Injectable()
export class ProductionWorkflowService {
  constructor(private readonly productStockService: ProductStockService) {}

  normalizeProcessCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /** ขั้นสุดท้ายของ flow ที่เป็น process_code COMPLETE (ไม่มีขั้นถัดไป) */
  getTerminalCompleteProcess(
    orderedProcesses: ProductionProcess[],
  ): ProductionProcess | null {
    if (orderedProcesses.length < 2) return null;
    const last = orderedProcesses[orderedProcesses.length - 1];
    if (this.normalizeProcessCode(last.processCode) !== 'COMPLETE') return null;
    return last;
  }

  async resolveOrderedProcessesForLot(
    manager: EntityManager,
    lot: ProductionLot,
    resolveOrderedProcesses: (manager: EntityManager, productId: number) => Promise<ProductionProcess[]>,
  ): Promise<ProductionProcess[]> {
    const order =
      lot.order ??
      (await manager.findOne(ProductionOrder, { where: { id: lot.orderId } }));
    if (!order) return [];
    return resolveOrderedProcesses(manager, order.productId);
  }

  /**
   * เมื่อขั้นก่อน Complete (ขั้นสุดท้ายของ flow) ปิดแล้ว — ปิด Complete ทันที
   * ไม่สร้าง IN_PROGRESS / คิวงานสำหรับ Complete
   */
  async autoCloseTerminalCompleteStep(
    manager: EntityManager,
    lot: ProductionLot,
    orderedProcesses: ProductionProcess[],
    operator: string,
    stockCreateBy: string,
    remarks?: string,
  ): Promise<boolean> {
    const completeProc = this.getTerminalCompleteProcess(orderedProcesses);
    if (!completeProc) return false;

    const prevProc = orderedProcesses[orderedProcesses.length - 2];
    const prevClosed = await manager.findOne(ProductionLotTracking, {
      where: { lotId: lot.id, processId: prevProc.id, status: 'COMPLETED' },
    });
    if (!prevClosed) return false;

    const alreadyDone = await manager.findOne(ProductionLotTracking, {
      where: { lotId: lot.id, processId: completeProc.id, status: 'COMPLETED' },
    });
    if (alreadyDone) {
      if (lot.status !== 'COMPLETED') {
        lot.status = 'COMPLETED';
        lot.currentProcessId = undefined;
        await manager.save(lot);
      }
      return true;
    }

    const now = new Date();
    const qty = Number(lot.quantity);
    const autoRemark = remarks?.trim()
      ? `${remarks.trim()} · ปิด Complete อัตโนมัติ`
      : 'ปิด Complete อัตโนมัติ';

    const openComplete = await manager.findOne(ProductionLotTracking, {
      where: {
        lotId: lot.id,
        processId: completeProc.id,
        status: 'IN_PROGRESS',
      },
    });
    if (openComplete) {
      openComplete.status = 'COMPLETED';
      openComplete.endTime = now;
      openComplete.quantityOut = qty;
      if (openComplete.quantityIn == null) {
        openComplete.quantityIn = qty;
      }
      openComplete.remarks = openComplete.remarks?.trim()
        ? `${openComplete.remarks} · ${autoRemark}`
        : autoRemark;
      await manager.save(openComplete);
    } else {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: lot.id,
          processId: completeProc.id,
          startTime: now,
          endTime: now,
          status: 'COMPLETED',
          operator,
          quantityIn: qty,
          quantityOut: qty,
          remarks: autoRemark,
        }),
      );
    }

    const prevLotStatus = lot.status;
    lot.status = 'COMPLETED';
    lot.currentProcessId = undefined;
    await manager.save(lot);

    if (prevLotStatus !== 'COMPLETED') {
      const order =
        lot.order ??
        (await manager.findOne(ProductionOrder, {
          where: { id: lot.orderId },
        }));
      if (order) {
        await this.productStockService.addFinishedGoodsFromLot(
          manager,
          order.productId,
          lot.quantity,
          {
            productionLotId: lot.id,
            productionLotNo: lot.lotNo,
            productionQrCode: lot.qrCode,
            productionOrderNo: order.orderNo,
            createBy: stockCreateBy,
          },
        );
      }
    }

    return true;
  }

  /** ล็อตย่อยส่วนที่ปล่อย — ปิดขั้นปัจจุบันแล้วส่งไปขั้นถัดไป (ถ้า workflow อนุญาต) */
  async applyReleasedLotWorkflowAfterSplit(
    manager: EntityManager,
    child: ProductionLot,
    opts: {
      releaseQty: number;
      currentProcessId: number;
      nextProcessId: number | undefined;
      moveReleasedToNextStep: boolean;
      operator: string;
      reason: string;
      parentLotNo: string;
    },
    resolveOrderedProcessesForLot: (manager: EntityManager, lot: ProductionLot) => Promise<ProductionProcess[]>,
    getTerminalCompleteProcess: (orderedProcesses: ProductionProcess[]) => ProductionProcess | null,
    autoCloseTerminalCompleteStep: (
      manager: EntityManager,
      lot: ProductionLot,
      orderedProcesses: ProductionProcess[],
      operator: string,
      stockCreateBy: string,
      remarks?: string,
    ) => Promise<boolean>,
  ): Promise<void> {
    const {
      releaseQty,
      currentProcessId,
      nextProcessId,
      moveReleasedToNextStep,
      operator,
      reason,
      parentLotNo,
    } = opts;
    const now = new Date();
    const splitNote = `แบ่งจาก ${parentLotNo}: ${reason}`;

    if (moveReleasedToNextStep && nextProcessId) {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: currentProcessId,
          startTime: now,
          endTime: now,
          status: 'COMPLETED',
          operator,
          quantityIn: releaseQty,
          quantityOut: releaseQty,
          remarks: splitNote,
        }),
      );
      child.currentProcessId = nextProcessId;
      child.status = 'IN_PROGRESS';
      await manager.save(child);

      const orderedProcesses =
        await resolveOrderedProcessesForLot(manager, child);
      const terminalComplete =
        getTerminalCompleteProcess(orderedProcesses);
      if (terminalComplete && terminalComplete.id === nextProcessId) {
        await autoCloseTerminalCompleteStep(
          manager,
          child,
          orderedProcesses,
          operator,
          operator,
          splitNote,
        );
        return;
      }

      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: nextProcessId,
          startTime: now,
          status: 'IN_PROGRESS',
          operator,
          quantityIn: releaseQty,
          remarks: splitNote,
        }),
      );
      return;
    }

    child.currentProcessId = currentProcessId;
    child.status = 'IN_PROGRESS';
    await manager.save(child);
    await manager.save(
      manager.create(ProductionLotTracking, {
        lotId: child.id,
        processId: currentProcessId,
        startTime: now,
        status: 'IN_PROGRESS',
        operator,
        quantityIn: releaseQty,
        remarks: splitNote,
      }),
    );
  }

  /** ล็อตย่อยส่วนที่เหลือ — คงอยู่ขั้นปัจจุบัน */
  async applyRemainingLotWorkflowAfterSplit(
    manager: EntityManager,
    child: ProductionLot,
    opts: {
      remainingQty: number;
      currentProcessId: number;
      parentWasInProgress: boolean;
      operator: string;
      reason: string;
      parentLotNo: string;
      openTrackingStartTime: Date | null;
      openTrackingOperator: string | null;
    },
  ): Promise<void> {
    const {
      remainingQty,
      currentProcessId,
      parentWasInProgress,
      operator,
      reason,
      parentLotNo,
      openTrackingStartTime,
      openTrackingOperator,
    } = opts;

    child.currentProcessId = currentProcessId;
    child.status = parentWasInProgress ? 'IN_PROGRESS' : 'PENDING';
    await manager.save(child);

    if (parentWasInProgress) {
      await manager.save(
        manager.create(ProductionLotTracking, {
          lotId: child.id,
          processId: currentProcessId,
          startTime: openTrackingStartTime ?? new Date(),
          status: 'IN_PROGRESS',
          operator: openTrackingOperator ?? operator,
          quantityIn: remainingQty,
          remarks: `คงเหลือจาก split ${parentLotNo}: ${reason}`,
        }),
      );
    }
  }
}
