import { PlanningRow } from '../entities/planning-row.entity';

export interface TransformedRow {
  batchId: number;
  customerCode: string;
  customerId: number | null;
  productCode: string;
  productId: number | null;
  model: string | null;
  saleDate: Date;
  quantity: number;
  originalRowNumber: number;
  status: 'VALID';
}

export interface TransformResult {
  transformedRows: TransformedRow[];
  totalRows: number;
  skippedRows: number;
}
