import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ResponseHelper } from '@app/common';

@Controller('products/master')
export class ProductsMasterController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('locations')
  async getAllLocations() {
    const locations = await this.productsService.findAllLocations();
    return ResponseHelper.success(locations, 'Locations retrieved successfully');
  }

  @Get('customers')
  async getAllCustomers() {
    const customers = await this.productsService.findAllCustomers();
    return ResponseHelper.success(customers, 'Customers retrieved successfully');
  }
}
