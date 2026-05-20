import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { formatValidationErrors } from './shared/validators/format-validation-errors';
import { PcErrorCode } from './shared/errors/pc-error.codes';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/** ใน dev อนุญาต localhost ทุกพอร์ต — กันเบราว์เซอร์ขึ้น Failed to fetch เมื่อ Next รันคนละพอร์ตกับที่ whitelist ไว้ */
const DEFAULT_DEV_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

/**
 * ใน dev ถ้าต้องการเปิดหน้า Next จากเครื่องอื่นใน LAN (เช่น http://192.168.x.x:3000)
 * ให้ตั้ง CORS_DEV_ALLOW_LAN=1 — จะอนุญาต origin ที่เป็น private IPv4 เท่านั้น
 */
const DEV_PRIVATE_LAN_ORIGIN_PATTERN =
  /^https?:\/\/(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(:\d+)?$/i;

/**
 * Cloudflare Quick Tunnel (TryCloudflare) — URL จะสุ่มทุกครั้ง เช่น
 *   https://respected-advert-programs-thomas.trycloudflare.com
 * ปกติเราใช้ Next.js rewrites เป็น proxy แล้วจะ same-origin ไม่ต้องผ่าน CORS
 * แต่เปิด pattern นี้ไว้เผื่อกรณีฝั่ง client เรียก backend tunnel ตรง ๆ
 */
const TRYCLOUDFLARE_ORIGIN_PATTERN =
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i;

function isDevLanCorsEnabled(): boolean {
  const raw = process.env.CORS_DEV_ALLOW_LAN ?? '';
  return raw === '1' || /^true$/i.test(raw) || /^yes$/i.test(raw);
}

function parseExtraOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const staticOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ];
  const extraOrigins = parseExtraOrigins();
  const isProduction = process.env.NODE_ENV === 'production';

  // Enable CORS (apiFetch ส่ง x-user-id / x-department-id → ต้องผ่าน preflight)
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (staticOrigins.includes(origin) || extraOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (!isProduction && DEFAULT_DEV_ORIGIN_PATTERN.test(origin)) {
        callback(null, true);
        return;
      }
      if (!isProduction && isDevLanCorsEnabled() && DEV_PRIVATE_LAN_ORIGIN_PATTERN.test(origin)) {
        callback(null, true);
        return;
      }
      if (TRYCLOUDFLARE_ORIGIN_PATTERN.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Accept-Language',
      'x-user-id',
      'x-username',
      'x-department-id',
      'X-Requested-With',
    ],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const fields = formatValidationErrors(errors);
        return new BadRequestException({
          success: false,
          code: PcErrorCode.VALIDATION_FAILED,
          message: fields[0]?.message ?? 'ข้อมูลไม่ถูกต้อง',
          errors: fields,
          timestamp: new Date().toISOString(),
        });
      },
    }),
  );

  const port = Number(process.env.PORT ?? 3006);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
