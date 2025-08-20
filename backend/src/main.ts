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

  // Create necessary directories
  const publicPath = join(process.cwd(), 'public');
  const uploadsPath = join(publicPath, 'uploads');
  const courseThumbnailsPath = join(uploadsPath, 'course-thumbnails');
  
  console.log('📁 Public path:', publicPath);
  console.log('📁 Uploads path:', uploadsPath);
  console.log('📁 Course thumbnails path:', courseThumbnailsPath);

  // Create directories if they don't exist
  [publicPath, uploadsPath, courseThumbnailsPath].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log('✅ Created directory:', dir);
    } else {
      console.log('📂 Directory already exists:', dir);
    }
  });

  // Static files configuration
  app.useStaticAssets(publicPath);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  
  // Debug: Print folder contents
  const fs = require('fs');
  try {
    console.log('📂 Checking uploads folder:', courseThumbnailsPath);
    if (fs.existsSync(courseThumbnailsPath)) {
      const files = fs.readdirSync(courseThumbnailsPath);
      console.log('📄 Files in uploads/course-thumbnails:', files.length > 0 ? files.slice(0, 5) : 'No files found');
    } else {
      console.log('❌ Uploads folder does not exist');
    }
  } catch (error) {
    console.log('❌ Error checking uploads folder:', error.message);
  }
}
bootstrap();