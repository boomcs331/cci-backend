import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../products/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { ValidationError, ValidationResult, BatchValidationResult } from '../interfaces/validation-result.interface';
import { ErrorCode } from '../constants/error-codes.enum';
import { VALIDATION_RULES, ERROR_MESSAGES, MONTH_NAMES } from '../constants/validation-rules.constant';

@Injectable()
export class PlanningValidationService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async validateBatch(
    rows: any[],
    year: number,
    month: number,
  ): Promise<BatchValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validRowsData: any[] = [];
    const daysInMonth = this.getDaysInMonth(year, month);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel rows are 1-indexed, header is row 1

      const result = await this.validateRow(row, rowNumber, year, month, daysInMonth);

      if (result.errors.length > 0) {
        errors.push(...result.errors);
      } else {
        validRowsData.push(row);
      }

      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
      }
    }

    return {
      totalRows: rows.length,
      validRows: validRowsData.length,
      errorRows: errors.length,
      warningRows: warnings.length,
      errors,
      warnings,
      validRowsData,
    };
  }

  async validateRow(
    row: any,
    rowNumber: number,
    year: number,
    month: number,
    daysInMonth: number,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    this.validateRequiredFields(row, rowNumber, errors);

    // Validate day columns
    this.validateDayColumns(row, rowNumber, year, month, daysInMonth, errors);

    // Validate total
    this.validateTotal(row, rowNumber, daysInMonth, errors);

    // Validate customer existence (warning only)
    await this.validateCustomerExists(row, rowNumber, warnings);

    // Validate product existence (warning only)
    await this.validateProductExists(row, rowNumber, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateRequiredFields(
    row: any,
    rowNumber: number,
    errors: ValidationError[],
  ): void {
    for (const field of VALIDATION_RULES.REQUIRED_FIELDS) {
      const value = row[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          rowNumber,
          field,
          value,
          code: ErrorCode.REQUIRED_FIELD_EMPTY,
          message: `${field} is required`,
          severity: 'ERROR',
        });
      }
    }
  }

  private validateDayColumns(
    row: any,
    rowNumber: number,
    year: number,
    month: number,
    daysInMonth: number,
    errors: ValidationError[],
  ): void {
    for (let day = 1; day <= 31; day++) {
      const dayValue = row[day.toString()];
      
      // Check if day exists in month
      if (day > daysInMonth && dayValue !== null && dayValue !== '' && dayValue !== 0) {
        errors.push({
          rowNumber,
          field: `Day ${day}`,
          value: dayValue,
          code: ErrorCode.INVALID_DAY_FOR_MONTH,
          message: `${MONTH_NAMES[month - 1]} ${year} has only ${daysInMonth} days but found quantity in Day ${day}`,
          severity: 'ERROR',
          details: {
            expectedDays: daysInMonth,
            actualDay: day,
            month,
            year,
          },
        });
      }

      // Validate quantity
      if (dayValue !== null && dayValue !== '' && dayValue !== 0) {
        const qty = parseFloat(dayValue);
        if (isNaN(qty)) {
          errors.push({
            rowNumber,
            field: `Day ${day}`,
            value: dayValue,
            code: ErrorCode.INVALID_QUANTITY,
            message: 'Quantity must be a valid number',
            severity: 'ERROR',
          });
        } else if (qty < 0) {
          errors.push({
            rowNumber,
            field: `Day ${day}`,
            value: dayValue,
            code: ErrorCode.NEGATIVE_QUANTITY,
            message: 'Quantity cannot be negative',
            severity: 'ERROR',
          });
        }
      }
    }
  }

  private validateTotal(
    row: any,
    rowNumber: number,
    daysInMonth: number,
    errors: ValidationError[],
  ): void {
    const total = parseFloat(row['Total']) || 0;
    const calculatedTotal = this.calculateRowTotal(row, daysInMonth);
    
    if (Math.abs(total - calculatedTotal) > 0.01) {
      errors.push({
        rowNumber,
        field: 'Total',
        value: total,
        code: ErrorCode.TOTAL_MISMATCH,
        message: `Total (${total}) does not match sum of daily quantities (${calculatedTotal})`,
        severity: 'ERROR',
        details: {
          expectedTotal: calculatedTotal,
          actualTotal: total,
          difference: Math.abs(total - calculatedTotal),
        },
      });
    }
  }

  private async validateCustomerExists(
    row: any,
    rowNumber: number,
    warnings: ValidationError[],
  ): Promise<void> {
    const customerCode = row['Customer'];
    if (!customerCode || customerCode.trim() === '') return;

    const customer = await this.customerRepository.findOne({
      where: { code: customerCode.trim() },
    });

    if (!customer) {
      warnings.push({
        rowNumber,
        field: 'Customer',
        value: customerCode,
        code: ErrorCode.CUSTOMER_NOT_FOUND,
        message: `Customer '${customerCode}' not found in master data`,
        severity: 'WARNING',
      });
    }
  }

  private async validateProductExists(
    row: any,
    rowNumber: number,
    warnings: ValidationError[],
  ): Promise<void> {
    const productCode = row['Part No'];
    if (!productCode || productCode.trim() === '') return;

    const product = await this.productRepository.findOne({
      where: { productCode: productCode.trim() },
    });

    if (!product) {
      warnings.push({
        rowNumber,
        field: 'Part No',
        value: productCode,
        code: ErrorCode.PRODUCT_NOT_FOUND,
        message: `Product '${productCode}' not found in master data`,
        severity: 'WARNING',
      });
    }
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private calculateRowTotal(row: any, daysInMonth: number): number {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const value = parseFloat(row[day.toString()]) || 0;
      total += value;
    }
    return total;
  }

  validateYear(year: number): ValidationError | null {
    if (year < VALIDATION_RULES.YEAR.MIN || year > VALIDATION_RULES.YEAR.MAX) {
      return {
        rowNumber: 0,
        field: 'Year',
        value: year,
        code: ErrorCode.INVALID_YEAR_MONTH,
        message: `Year must be between ${VALIDATION_RULES.YEAR.MIN} and ${VALIDATION_RULES.YEAR.MAX}`,
        severity: 'ERROR',
      };
    }
    return null;
  }

  validateMonth(month: number): ValidationError | null {
    if (month < VALIDATION_RULES.MONTH.MIN || month > VALIDATION_RULES.MONTH.MAX) {
      return {
        rowNumber: 0,
        field: 'Month',
        value: month,
        code: ErrorCode.INVALID_YEAR_MONTH,
        message: `Month must be between ${VALIDATION_RULES.MONTH.MIN} and ${VALIDATION_RULES.MONTH.MAX}`,
        severity: 'ERROR',
      };
    }
    return null;
  }

  validateFileSize(fileSize: number): ValidationError | null {
    if (fileSize > VALIDATION_RULES.FILE.MAX_SIZE) {
      return {
        rowNumber: 0,
        field: 'File',
        value: fileSize,
        code: ErrorCode.FILE_TOO_LARGE,
        message: `File size exceeds ${VALIDATION_RULES.FILE.MAX_SIZE / (1024 * 1024)}MB limit`,
        severity: 'ERROR',
      };
    }
    return null;
  }

  validateFileType(mimeType: string): ValidationError | null {
    if (!VALIDATION_RULES.FILE.ALLOWED_TYPES.includes(mimeType)) {
      return {
        rowNumber: 0,
        field: 'File',
        value: mimeType,
        code: ErrorCode.INVALID_FILE_TYPE,
        message: ERROR_MESSAGES[ErrorCode.INVALID_FILE_TYPE],
        severity: 'ERROR',
      };
    }
    return null;
  }
}
