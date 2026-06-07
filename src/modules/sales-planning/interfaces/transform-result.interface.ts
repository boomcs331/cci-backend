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
  gate: string | null;
  location: string | null;
  round: number | null;
  line: number | null;
}

export interface TransformResult {
  transformedRows: TransformedRow[];
  totalRows: number;
  skippedRows: number;
}
