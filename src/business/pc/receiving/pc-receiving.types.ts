export interface CreateReceivingBusinessInput {
  materialId: number;
  totalQuantity: number;
  supplierId?: number;
  poNo?: string;
  remark?: string;
  locationId?: number;
  expiryDate?: string;
  mfgDate?: string;
  createBy?: string;
}

export interface ValidatedCreateReceiving {
  materialId: number;
  totalQuantity: number;
  supplierId?: number;
  poNo: string;
  remark?: string;
  locationId?: number;
  expiryDate?: string;
  mfgDate: string;
  mfgDateAsDate: Date;
  createBy: string;
}

export interface LotSplitResult {
  numberOfLots: number;
  quantityPerLot: number;
  lastLotQuantity: number;
}

export interface LotIdentifierPair {
  lotNo: string;
  lotPdNo: string;
}
