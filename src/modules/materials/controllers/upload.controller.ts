import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { ResponseHelper } from '@app/common';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

@Controller('materials/upload')
export class UploadController {
  @Post('document')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadDocument(@UploadedFiles() files: any[]) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files uploaded');

    const uploadDir = './uploads/material-issues';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      if (!file.originalname.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}`,
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(`File too large: ${file.originalname}`);
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `issue-${uniqueSuffix}${ext}`;
      const filepath = join(uploadDir, filename);

      writeFileSync(filepath, file.buffer);

      uploadedFiles.push({
        originalName: file.originalname,
        filePath: `uploads/material-issues/${filename}`,
        size: file.size,
      });
    }

    return ResponseHelper.success(
      { files: uploadedFiles },
      'Files uploaded successfully',
    );
  }

  /** Single image for material workpiece (ชิ้นงาน) — JPEG/PNG/WebP, max 5MB */
  @Post('workpiece-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadWorkpieceImage(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
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

    const uploadDir = './uploads/material-workpieces';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '.jpg';
    const filename = `workpiece-${uniqueSuffix}${ext}`;
    const filepath = join(uploadDir, filename);

    writeFileSync(filepath, file.buffer);

    return ResponseHelper.success(
      {
        filePath: `uploads/material-workpieces/${filename}`,
        originalName: file.originalname,
        size: file.size,
      },
      'Upload successful',
    );
  }
}
