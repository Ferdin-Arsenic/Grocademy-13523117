import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('admin')
  @UseInterceptors(FileInterceptor('thumbnail_image', { // 'thumbnail_image' adalah nama field di form
    storage: diskStorage({
      destination: './public/uploads/course-thumbnails', // Folder penyimpanan
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
    return this.coursesService.create(createCourseDto, filePath);
  }

  @Get()
  findAll(
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string, // <-- Tambahkan ini
    @Query('sortOrder') sortOrder?: 'asc' | 'desc', // <-- Tambahkan ini
  ) {
    return this.coursesService.findAll(query, page, limit, sortBy, sortOrder);
  }

  @Get(':id/modules')
  @UseGuards(JwtAuthGuard)
  findModulesForUser(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.coursesService.findModulesForUser(id, user.id);
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

  @Get('user/my-courses')
  @UseGuards(JwtAuthGuard) // Ditambahkan di level method
  findMyCourses(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.coursesService.findMyCourses(user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // Ditambahkan di level method
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto); 
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}