import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class GenerateProductQrOrdersFromPlanDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  planItemIds?: number[];

  /**
   * จำนวนชิ้นต่อกล่อง/ต่อ QR แยกตาม productId (key เป็น string ตาม JSON)
   * ถ้าไม่ส่ง ใช้ products.lot_size หรือค่า default 100
   */
  @IsOptional()
  @IsObject()
  lotSizeByProductId?: Record<string, number>;

  /**
   * จำนวนต่อกล่องเดียวกันทุกรายการในแผน (override ทั้ง lotSizeByProductId และ product.lot_size)
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  defaultLotSize?: number;
}
