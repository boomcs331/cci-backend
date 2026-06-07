import { ErrorCode } from './error-codes.enum';

export const VALIDATION_RULES = {
  REQUIRED_FIELDS: ['Customer', 'Part No'],

  QUANTITY: {
    MIN: 0,
    MAX: 999999999.99,
  },

  YEAR: {
    MIN: 2000,
    MAX: 2100,
  },

  MONTH: {
    MIN: 1,
    MAX: 12,
  },

  ROUND: {
    MIN: 1,
    MAX: 999,
  },

  FILE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.REQUIRED_FIELD_EMPTY]: 'Field is required',
  [ErrorCode.INVALID_QUANTITY]: 'Quantity must be a valid number',
  [ErrorCode.NEGATIVE_QUANTITY]: 'Quantity cannot be negative',
  [ErrorCode.INVALID_ROUND]: 'Round must be a positive integer (1, 2, 3, ...)',
  [ErrorCode.INVALID_DAY_FOR_MONTH]: 'Day does not exist in the selected month',
  [ErrorCode.TOTAL_MISMATCH]: 'Total does not match sum of daily quantities',
  [ErrorCode.CUSTOMER_NOT_FOUND]: 'Customer not found in master data',
  [ErrorCode.PRODUCT_NOT_FOUND]: 'Product not found in master data',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds 10MB limit',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Please upload Excel file',
  [ErrorCode.BATCH_ALREADY_EXISTS]: 'Planning data already exists for this month',
  [ErrorCode.INVALID_YEAR_MONTH]: 'Invalid year or month',
};

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
