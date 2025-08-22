import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'file://',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });
  const publicPath = join(process.cwd(), 'public');
  const uploadsPath = join(publicPath, 'uploads');
  const courseThumbnailsPath = join(uploadsPath, 'course-thumbnails');
  const pdfsPath = join(uploadsPath, 'pdfs');
  const videosPath = join(uploadsPath, 'videos');

  // Create directories if they don't exist
  [publicPath, uploadsPath, courseThumbnailsPath, pdfsPath, videosPath].forEach(dir => { // TAMBAHKAN pdfsPath & videosPath DI SINI
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log('✅ Created directory:', dir);
    }
  });

  app.useStaticAssets(join(process.cwd(), 'public'));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const fs = require('fs');
  try {
    if (fs.existsSync(courseThumbnailsPath)) {
      const files = fs.readdirSync(courseThumbnailsPath);
    }
  } catch (error) {
  }
}
bootstrap();