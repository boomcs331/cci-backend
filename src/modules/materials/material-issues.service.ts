import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialIssue } from './entities/material-issue.entity';
import { MaterialIssueItem } from './entities/material-issue-item.entity';
import { MaterialIssueDocument } from './entities/material-issue-document.entity';
import { Material } from './entities/material.entity';
import { MaterialsStock } from './entities/materials-stock.entity';
import { Product } from '../products/entities/product.entity';
import { ProductBom } from '../products/entities/product-bom.entity';
import {
  CreateManualIssueDto,
  CreateProductionIssueDto,
  PreviewProductionIssueDto,
} from './dto/material-issue.dto';

@Injectable()
export class MaterialIssuesService {
  constructor(
    @InjectRepository(MaterialIssue)
    private issueRepo: Repository<MaterialIssue>,
    @InjectRepository(MaterialIssueItem)
    private issueItemRepo: Repository<MaterialIssueItem>,
    @InjectRepository(MaterialIssueDocument)
    private issueDocumentRepo: Repository<MaterialIssueDocument>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(MaterialsStock)
    private stockRepo: Repository<MaterialsStock>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBom)
    private bomRepo: Repository<ProductBom>,
    private dataSource: DataSource,
  ) {}

  async createManualIssue(dto: CreateManualIssueDto, user: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of dto.items) {
        const material = await this.materialRepo.findOne({
          where: { id: item.materialId },
        });
        if (!material)
          throw new NotFoundException(
            `Material with id ${item.materialId} not found`,
          );

        const stock = await this.stockRepo.findOne({
          where: { materialId: item.materialId },
        });
        if (!stock || stock.availableQty < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for material ${material.matCode}`,
          );
        }
      }

      const issueNo = await this.generateIssueNo();
      const issue = queryRunner.manager.create(MaterialIssue, {
        issueNo,
        issueDate: new Date(dto.issueDate),
        issueType: 'MANUAL',
        documentNo: dto.documentNo,
        remarks: dto.remarks,
        createBy: user,
        updateBy: user,
      });

      const savedIssue = await queryRunner.manager.save(issue);

      if (dto.documentFiles && dto.documentFiles.length > 0) {
        for (const doc of dto.documentFiles) {
          const document = queryRunner.manager.create(MaterialIssueDocument, {
            issueId: savedIssue.id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            createBy: user,
          });
          await queryRunner.manager.save(document);
        }
      }

      for (const item of dto.items) {
        const issueItem = queryRunner.manager.create(MaterialIssueItem, {
          issueId: savedIssue.id,
          materialId: item.materialId,
          issuedQuantity: item.quantity,
          unit: item.unit,
          fromLocationId: item.fromLocationId,
          remarks: item.remarks,
          createBy: user,
        });
        await queryRunner.manager.save(issueItem);

        await queryRunner.manager.decrement(
          MaterialsStock,
          { materialId: item.materialId },
          'availableQty',
          item.quantity,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedIssue.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createProductionIssue(dto: CreateProductionIssueDto, user: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
        relations: ['boms', 'boms.material'],
      });
      if (!product) throw new NotFoundException('Product not found');
      if (!product.boms || product.boms.length === 0) {
        throw new BadRequestException('Product has no BOM');
      }

      for (const bom of product.boms) {
        const requiredQty =
          Number(bom.quantityPerUnit) * dto.productionQuantity;
        const stock = await this.stockRepo.findOne({
          where: { materialId: bom.materialId },
        });
        if (!stock || stock.availableQty < requiredQty) {
          throw new BadRequestException(
            `Insufficient stock for material ${bom.material.matCode}`,
          );
        }
      }

      const issueNo = await this.generateIssueNo();
      const issue = queryRunner.manager.create(MaterialIssue, {
        issueNo,
        issueDate: new Date(dto.issueDate),
        issueType: 'PRODUCTION',
        productionOrderNo: dto.productionOrderNo,
        productId: dto.productId,
        productionQuantity: dto.productionQuantity,
        remarks: dto.remarks,
        createBy: user,
        updateBy: user,
      });

      const savedIssue = await queryRunner.manager.save(issue);

      if (dto.documentFiles && dto.documentFiles.length > 0) {
        for (const doc of dto.documentFiles) {
          const document = queryRunner.manager.create(MaterialIssueDocument, {
            issueId: savedIssue.id,
            fileName: doc.fileName,
            filePath: doc.filePath,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            createBy: user,
          });
          await queryRunner.manager.save(document);
        }
      }

      for (const bom of product.boms) {
        const issuedQty = Number(bom.quantityPerUnit) * dto.productionQuantity;
        const issueItem = queryRunner.manager.create(MaterialIssueItem, {
          issueId: savedIssue.id,
          materialId: bom.materialId,
          quantityPerUnit: bom.quantityPerUnit,
          issuedQuantity: issuedQty,
          unit: bom.unit,
          fromLocationId: dto.fromLocationId,
          createBy: user,
        });
        await queryRunner.manager.save(issueItem);

        await queryRunner.manager.decrement(
          MaterialsStock,
          { materialId: bom.materialId },
          'availableQty',
          issuedQty,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedIssue.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async previewProductionIssue(dto: PreviewProductionIssueDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['boms', 'boms.material'],
    });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.boms || product.boms.length === 0) {
      throw new BadRequestException('Product has no BOM');
    }

    const requiredMaterials = await Promise.all(
      product.boms.map(async (bom) => {
        const requiredQty =
          Number(bom.quantityPerUnit) * dto.productionQuantity;
        const stock = await this.stockRepo.findOne({
          where: { materialId: bom.materialId },
        });

        return {
          materialId: bom.materialId,
          materialCode: bom.material.matCode,
          materialName: bom.material.matName,
          quantityPerUnit: bom.quantityPerUnit,
          requiredQuantity: requiredQty,
          unit: bom.unit,
          currentStock: stock?.availableQty || 0,
          isAvailable: stock && stock.availableQty >= requiredQty,
        };
      }),
    );

    return {
      productId: product.id,
      productCode: product.productCode,
      productName: product.productName,
      productionQuantity: dto.productionQuantity,
      requiredMaterials,
    };
  }

  async findAll(
    page = 1,
    limit = 10,
    issueType?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.issueRepo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.items', 'items')
      .leftJoinAndSelect('items.material', 'material')
      .leftJoinAndSelect('issue.product', 'product')
      .leftJoinAndSelect('issue.documents', 'documents')
      .where('issue.isActive = :isActive', { isActive: true });

    if (issueType)
      query.andWhere('issue.issueType = :issueType', { issueType });
    if (startDate)
      query.andWhere('issue.issueDate >= :startDate', { startDate });
    if (endDate) query.andWhere('issue.issueDate <= :endDate', { endDate });

    query
      .orderBy('issue.issueDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: ['items', 'items.material', 'product', 'documents'],
    });
    if (!issue) throw new NotFoundException('Material issue not found');
    return issue;
  }

  private async generateIssueNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `ISS-${year}${month}`;

    const lastIssue = await this.issueRepo.findOne({
      where: {},
      order: { id: 'DESC' },
    });

    let sequence = 1;
    if (lastIssue && lastIssue.issueNo.startsWith(prefix)) {
      const lastSeq = parseInt(lastIssue.issueNo.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
