import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductBom, ProductLocation, Customer } from './entities';
import { CreateProductDto, UpdateProductDto, CreateProductWithBomDto, CreateBomDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBom)
    private bomRepo: Repository<ProductBom>,
    @InjectRepository(ProductLocation)
    private locationRepo: Repository<ProductLocation>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async findAllWithoutPagination() {
    return this.productRepo.find({
      where: { isActive: true },
      relations: ['boms', 'boms.material', 'boms.material.materialsType'],
      order: { id: 'ASC' },
    });
  }

  async findAllLocations() {
    return this.locationRepo.find({ order: { id: 'ASC' } });
  }

  async findAllCustomers() {
    return this.customerRepo.find({ where: { isActive: true }, order: { id: 'ASC' } });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'id',
    sortOrder: string = 'ASC',
    isActive?: boolean
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.boms', 'boms')
      .leftJoinAndSelect('boms.material', 'material')
      .leftJoinAndSelect('material.materialsType', 'materialsType');

    if (isActive !== undefined) {
      queryBuilder.where('product.isActive = :isActive', { isActive });
    } else {
      queryBuilder.where('product.isActive = :isActive', { isActive: true });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.productCode ILIKE :search OR product.productName ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const validSortColumns = ['id', 'productCode', 'productName', 'createDate', 'updateDate'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder.orderBy(`product.${sortColumn}`, order);

    const total = await queryBuilder.getCount();
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['boms', 'boms.material', 'boms.material.materialsType'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByCode(code: string) {
    const product = await this.productRepo.findOne({
      where: { productCode: code },
      relations: ['boms', 'boms.material', 'boms.material.materialsType'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductWithBomDto, user: string) {
    const exists = await this.productRepo.findOne({ where: { productCode: dto.productCode } });
    if (exists) throw new ConflictException('Product code already exists');

    const product = this.productRepo.create({
      ...dto,
      createBy: user,
      updateBy: user,
    });
    const saved = await this.productRepo.save(product);

    if (dto.bom && Array.isArray(dto.bom) && dto.bom.length > 0) {
      await this.addBomItems(saved.id, dto.bom, user);
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto, user: string) {
    const product = await this.findOne(id);
    Object.assign(product, dto, { updateBy: user });
    await this.productRepo.save(product);
    return this.findOne(id);
  }

  async delete(id: number) {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepo.save(product);
    return { message: 'Product deleted successfully' };
  }

  async getBom(productId: number) {
    const product = await this.findOne(productId);
    return product.boms;
  }

  async addBomItems(productId: number, items: CreateBomDto[], user: string) {
    const product = await this.findOne(productId);
    const boms = items.map(item =>
      this.bomRepo.create({
        productId: product.id,
        ...item,
        createBy: user,
        updateBy: user,
      }),
    );
    return this.bomRepo.save(boms);
  }

  async removeBomItem(bomId: number) {
    const bom = await this.bomRepo.findOne({ where: { id: bomId } });
    if (!bom) throw new NotFoundException('BOM item not found');
    await this.bomRepo.remove(bom);
    return { message: 'BOM item removed successfully' };
  }

  async calculateMaterialRequirements(productId: number, quantity: number) {
    const product = await this.findOne(productId);
    return product.boms.map(bom => ({
      materialId: bom.materialId,
      materialCode: bom.material.matCode,
      materialType: bom.material.materialsType.code,
      quantityPerUnit: bom.quantityPerUnit,
      requiredQuantity: Number(bom.quantityPerUnit) * quantity,
      unit: bom.unit,
    }));
  }
}
