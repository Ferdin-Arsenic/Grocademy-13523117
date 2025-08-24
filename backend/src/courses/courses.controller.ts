import { Controller, Get, Post, Body, Put, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('admin')
  @UseInterceptors(FileInterceptor('thumbnail_image', {
    storage: diskStorage({
      destination: './public/uploads/course-thumbnails',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const filePath = file ? `/uploads/course-thumbnails/${file.filename}` : null;
    if (createCourseDto.topics && typeof createCourseDto.topics === 'string') {
      (createCourseDto.topics as any) = (createCourseDto.topics as string)
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0); 
    } else if (!createCourseDto.topics) {
      (createCourseDto.topics as any) = [];
    }

    return this.coursesService.create(createCourseDto, filePath);
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  findMyCourses(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.coursesService.findMyCourses(user.id);
  }

  @Get('for-user')
  @UseGuards(JwtAuthGuard)
  findAllForUser(
    @Req() req: Request,
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const user = req.user as { id: string };
    return this.coursesService.findAllForUser(user.id, query, page, limit, sortBy, sortOrder);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) 
  @CacheKey('ALL_COURSES') 
  findAll(
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.coursesService.findAll(query, page, limit, sortBy, sortOrder);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(':id/buy')
  @UseGuards(JwtAuthGuard)
  buyCourse(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.coursesService.buyCourse(id, user.id);
  }

  // FIX: Tambahkan FileInterceptor untuk update juga
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('thumbnail_image', {
    storage: diskStorage({
      destination: './public/uploads/course-thumbnails',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  update(
    @Param('id') id: string, 
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Handle topics parsing seperti di create
    if (updateCourseDto.topics && typeof updateCourseDto.topics === 'string') {
      (updateCourseDto.topics as any) = (updateCourseDto.topics as string)
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0); 
    }

    const filePath = file ? `/uploads/course-thumbnails/${file.filename}` : null;
    return this.coursesService.update(id, updateCourseDto, filePath); 
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id); 
  }
}