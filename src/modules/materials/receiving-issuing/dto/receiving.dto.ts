import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { PC_ERROR_MESSAGES } from '../../../../shared/errors/pc-error.messages';
import { PcErrorCode } from '../../../../shared/errors/pc-error.codes';
import { IsPoNo } from '../../../../shared/validators/decorators/is-po-no.decorator';
import { IsMfgDate } from '../../../../shared/validators/decorators/is-mfg-date.decorator';
import { PoNoValidator } from '../../../../shared/validators/po-no.validator';

/** Transport-layer DTO — structural checks only; rules live in business layer. */
export class CreateReceivingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  totalQuantity: number;

  @IsOptional()
  @IsNumber()
  supplierId?: number;

  @IsString()
  @IsNotEmpty({ message: PC_ERROR_MESSAGES[PcErrorCode.PC_PO_NO_REQUIRED] })
  @Transform(({ value }) => PoNoValidator.normalize(value))
  @IsPoNo()
  poNo: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsString()
  @IsMfgDate()
  mfgDate: string;

  @IsOptional()
  @IsString()
  lotNo?: string;

  @IsOptional()
  @IsString()
  lotPdNo?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
