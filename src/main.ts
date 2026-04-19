import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/** ใน dev อนุญาต localhost ทุกพอร์ต — กันเบราว์เซอร์ขึ้น Failed to fetch เมื่อ Next รันคนละพอร์ตกับที่ whitelist ไว้ */
const DEFAULT_DEV_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

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
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Accept-Language',
      'x-user-id',
      'x-department-id',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3006);
}
bootstrap();
