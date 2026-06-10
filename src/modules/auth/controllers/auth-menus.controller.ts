import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateMenuDto } from '../dto/create-menu.dto';
import { UpdateMenuDto } from '../dto/update-menu.dto';
import { AuthSanitizeUserInterceptor } from '../interceptors/auth-sanitize-user.interceptor';
import { withCollection, withMessage } from '../utils/auth-response.util';

@Controller('auth')
@UseInterceptors(AuthSanitizeUserInterceptor)
export class AuthMenusController {
  constructor(private readonly authService: AuthService) {}

  @Post('menus')
  async createMenu(@Body() createMenuDto: CreateMenuDto) {
    const menu = await this.authService.createMenu(createMenuDto);
    return withMessage('Menu created successfully', 'menu', menu);
  }

  @Get('menus')
  async getAllMenus() {
    const menus = await this.authService.findAllMenus();
    return withCollection('menus', menus);
  }

  @Get('menus/:id')
  async getMenuById(@Param('id') id: string) {
    return this.authService.findMenuById(id);
  }

  @Put('menus/:id')
  async updateMenu(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    const menu = await this.authService.updateMenu(id, updateMenuDto);
    return withMessage('Menu updated successfully', 'menu', menu);
  }

  @Delete('menus/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenu(@Param('id') id: string) {
    await this.authService.deleteMenu(id);
    return { message: 'Menu deleted successfully' };
  }
}
