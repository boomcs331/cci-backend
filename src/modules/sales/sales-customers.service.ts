import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '@app/common';
import { Customer } from '../products/entities/customer.entity';

export interface SalesCustomerDto {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: number | null;
  creditBalance: number | null;
  paymentTerms: string | null;
  taxId: string | null;
  isActive: boolean;
}

export interface CreateSalesCustomerDto {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  paymentTerms?: string;
  taxId?: string;
}

export interface UpdateSalesCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  creditBalance?: number;
  paymentTerms?: string;
  taxId?: string;
  isActive?: boolean;
}

@Injectable()
export class SalesCustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async findAll(search?: string): Promise<SalesCustomerDto[]> {
    const qb = this.customerRepo.createQueryBuilder('c');

    if (search) {
      qb.andWhere(
        '(c.code ILIKE :search OR c.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('c.name', 'ASC');

    const customers = await qb.getMany();

    return customers.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      creditLimit: c.creditLimit,
      creditBalance: c.creditBalance,
      paymentTerms: c.paymentTerms,
      taxId: c.taxId,
      isActive: c.isActive,
    }));
  }

  async findOne(id: number): Promise<SalesCustomerDto> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('ไม่พบลูกค้า');
    }

    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      creditLimit: customer.creditLimit,
      creditBalance: customer.creditBalance,
      paymentTerms: customer.paymentTerms,
      taxId: customer.taxId,
      isActive: customer.isActive,
    };
  }

  async create(dto: CreateSalesCustomerDto, username: string) {
    const existing = await this.customerRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('รหัสลูกค้านี้มีอยู่แล้ว');
    }

    const customer = new Customer();
    customer.code = dto.code;
    customer.name = dto.name;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.address !== undefined) customer.address = dto.address;
    if (dto.creditLimit !== undefined) customer.creditLimit = dto.creditLimit;
    if (dto.paymentTerms !== undefined) customer.paymentTerms = dto.paymentTerms;
    if (dto.taxId !== undefined) customer.taxId = dto.taxId;
    customer.isActive = true;
    customer.createBy = username;
    customer.updateBy = username;

    const saved = await this.customerRepo.save(customer);

    return ResponseHelper.success(await this.findOne(saved.id), 'สร้างลูกค้าสำเร็จ');
  }

  async update(id: number, dto: UpdateSalesCustomerDto, username: string) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('ไม่พบลูกค้า');
    }

    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.address !== undefined) customer.address = dto.address;
    if (dto.creditLimit !== undefined) customer.creditLimit = dto.creditLimit;
    if (dto.creditBalance !== undefined) customer.creditBalance = dto.creditBalance;
    if (dto.paymentTerms !== undefined) customer.paymentTerms = dto.paymentTerms;
    if (dto.taxId !== undefined) customer.taxId = dto.taxId;
    if (dto.isActive !== undefined) customer.isActive = dto.isActive;
    customer.updateBy = username;

    await this.customerRepo.save(customer);

    return ResponseHelper.success(await this.findOne(id), 'อัปเดตลูกค้าสำเร็จ');
  }

  async remove(id: number) {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('ไม่พบลูกค้า');
    }

    await this.customerRepo.delete({ id });
    return ResponseHelper.success({ id }, 'ลบลูกค้าสำเร็จ');
  }
}
