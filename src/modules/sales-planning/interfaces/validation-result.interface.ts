export interface ValidationError {
  rowNumber: number;
  field: string;
  value: any;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  details?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface BatchValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRowsData: any[];
}
