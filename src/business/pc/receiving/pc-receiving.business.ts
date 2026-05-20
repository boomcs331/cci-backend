import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../shared/errors/business.exception';
import { PcErrorCode } from '../../../shared/errors/pc-error.codes';
import { MfgDateValidator } from '../../../shared/validators/mfg-date.validator';
import { PoNoValidator } from '../../../shared/validators/po-no.validator';
import type {
  CreateReceivingBusinessInput,
  LotIdentifierPair,
  LotSplitResult,
  ValidatedCreateReceiving,
} from './pc-receiving.types';

@Injectable()
export class PcReceivingBusiness {
  /**
   * Centralized rules for PC material receiving (รับวัตถุดิบ).
   * Throws BusinessException — never duplicate these checks in controller/service/DTO.
   */
  validateAndNormalize(
    input: CreateReceivingBusinessInput,
  ): ValidatedCreateReceiving {
    if (!input.materialId) {
      throw BusinessException.fromCode(PcErrorCode.PC_MATERIAL_REQUIRED, {
        field: 'materialId',
      });
    }

    if (!input.totalQuantity || input.totalQuantity <= 0) {
      throw BusinessException.fromCode(PcErrorCode.PC_QUANTITY_INVALID, {
        field: 'totalQuantity',
      });
    }

    const poResult = PoNoValidator.validate(input.poNo);
    if (!poResult.valid) {
      throw BusinessException.fromCode(poResult.code, {
        field: poResult.field,
        message: poResult.message,
      });
    }

    const mfgResult = MfgDateValidator.validate(input.mfgDate);
    if (!mfgResult.valid) {
      throw BusinessException.fromCode(mfgResult.code, {
        field: mfgResult.field,
        message: mfgResult.message,
      });
    }

    return {
      materialId: input.materialId,
      totalQuantity: input.totalQuantity,
      supplierId: input.supplierId,
      poNo: poResult.value!,
      remark: input.remark?.trim() || undefined,
      locationId: input.locationId,
      expiryDate: input.expiryDate,
      mfgDate: mfgResult.value!,
      mfgDateAsDate: new Date(mfgResult.value!),
      createBy: input.createBy?.trim() || 'system',
    };
  }

  calculateLotSplit(totalQuantity: number, lotSize: number): LotSplitResult {
    const effectiveLotSize = lotSize > 0 ? lotSize : 1;
    const numberOfLots = Math.ceil(totalQuantity / effectiveLotSize);
    const quantityPerLot = effectiveLotSize;
    const lastLotQuantity =
      totalQuantity - quantityPerLot * (numberOfLots - 1);

    return { numberOfLots, quantityPerLot, lastLotQuantity };
  }

  generateReceivingNo(year: number, sequence: number): string {
    return `RCV-${year}-${String(sequence).padStart(8, '0')}`;
  }

  formatDatePrefix(date: Date): string {
    return (
      date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0')
    );
  }

  buildLotIdentifiers(params: {
    pcDatePrefix: string;
    pdDatePrefix: string;
    existingPcCount: number;
    existingPdCount: number;
    lotIndex: number;
  }): LotIdentifierPair {
    const { pcDatePrefix, pdDatePrefix, existingPcCount, existingPdCount, lotIndex } =
      params;
    const pcRunNo = String(existingPcCount + lotIndex + 1).padStart(3, '0');
    const pdRunNo = String(existingPdCount + lotIndex + 1).padStart(3, '0');
    return {
      lotNo: `PC${pcDatePrefix}-${pcRunNo}`,
      lotPdNo: `PD${pdDatePrefix}-${pdRunNo}`,
    };
  }

  startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
}
