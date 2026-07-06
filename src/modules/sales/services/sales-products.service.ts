import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { Product } from '../../products/entities/product.entity';
import { ProductsStock } from '../../products/entities/products-stock.entity';

export interface SalesProductDto {
  id: number;
  productCode: string;
  productName: string;
  barcode: string | null;
  salePrice: number | null;
  categoryId: number | null;
  isActive: boolean;
  stockQuantity: string | null;
}

export interface CreateSalesProductDto {
  productCode: string;
  productName: string;
  barcode?: string;
  salePrice?: number;
  categoryId?: number;
}

export interface UpdateSalesProductDto {
  productName?: string;
  barcode?: string;
  salePrice?: number;
  categoryId?: number;
  isActive?: boolean;
}

@Injectable()
export class SalesProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductsStock)
    private readonly stockRepo: Repository<ProductsStock>,
  ) {}

  async findAll(search?: string): Promise<SalesProductDto[]> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.stock', 's')
      .select([
        'p.id',
        'p.productCode',
        'p.productName',
        'p.barcode',
        'p.salePrice',
        'p.categoryId',
        'p.isActive',
        's.totalQty',
      ]);

    if (search) {
      qb.andWhere(
        '(p.productCode ILIKE :search OR p.productName ILIKE :search OR p.barcode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('p.productName', 'ASC');

    const products = await qb.getMany();

    return products.map((p) => ({
      id: p.id,
      productCode: p.productCode,
      productName: p.productName,
      barcode: p.barcode,
      salePrice: p.salePrice,
      categoryId: p.categoryId,
      isActive: p.isActive,
      stockQuantity: p.stock?.totalQty ?? null,
    }));
  }

  async findOne(id: number): Promise<SalesProductDto> {
    const product = await this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.stock', 's')
      .select([
        'p.id',
        'p.productCode',
        'p.productName',
        'p.barcode',
        'p.salePrice',
        'p.categoryId',
        'p.isActive',
        's.totalQty',
      ])
      .where('p.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException('ไม่พบสินค้า');
    }

    return {
      id: product.id,
      productCode: product.productCode,
      productName: product.productName,
      barcode: product.barcode,
      salePrice: product.salePrice,
      categoryId: product.categoryId,
      isActive: product.isActive,
      stockQuantity: product.stock?.totalQty ?? null,
    };
  }

  async create(dto: CreateSalesProductDto, username: string) {
    const existing = await this.productRepo.findOne({
      where: { productCode: dto.productCode },
    });
    if (existing) {
      throw new BadRequestException('รหัสสินค้านี้มีอยู่แล้ว');
    }

    const product = new Product();
    product.productCode = dto.productCode;
    product.productName = dto.productName;
    if (dto.barcode !== undefined) product.barcode = dto.barcode;
    product.salePrice = dto.salePrice ?? 0;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    product.isActive = true;
    product.createBy = username;
    product.updateBy = username;

    const saved = await this.productRepo.save(product);

    return ResponseHelper.success(await this.findOne(saved.id), 'สร้างสินค้าสำเร็จ');
  }

  async update(id: number, dto: UpdateSalesProductDto, username: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('ไม่พบสินค้า');
    }

    if (dto.productName !== undefined) product.productName = dto.productName;
    if (dto.barcode !== undefined) product.barcode = dto.barcode;
    if (dto.salePrice !== undefined) product.salePrice = dto.salePrice;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;
    product.updateBy = username;

    await this.productRepo.save(product);

    return ResponseHelper.success(await this.findOne(id), 'อัปเดตสินค้าสำเร็จ');
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('ไม่พบสินค้า');
    }

    await this.productRepo.delete({ id });
    return ResponseHelper.success({ id }, 'ลบสินค้าสำเร็จ');
  }
}
