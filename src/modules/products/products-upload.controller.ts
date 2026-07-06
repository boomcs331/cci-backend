import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { ResponseHelper } from '@app/common';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

@Controller('products/upload')
export class ProductsUploadController {
  /** รูปภาพสินค้า — JPEG/PNG/WebP, max 5MB */
  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
    if (!allowed.test(file.mimetype)) {
      throw new BadRequestException(
        'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)',
      );
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('ไฟล์ต้องไม่เกิน 5 MB');
    }

    const uploadDir = './uploads/product-images';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '.jpg';
    const filename = `product-${uniqueSuffix}${ext}`;
    const filepath = join(uploadDir, filename);

    writeFileSync(filepath, file.buffer);

    return ResponseHelper.success(
      {
        filePath: `uploads/product-images/${filename}`,
        originalName: file.originalname,
        size: file.size,
      },
      'Upload successful',
    );
  }
}
