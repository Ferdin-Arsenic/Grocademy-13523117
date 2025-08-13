import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, DefaultValuePipe, ParseIntPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import type { Request } from 'express';

@Controller('courses') 
@UseGuards(JwtAuthGuard, RolesGuard) 
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('admin')
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit?: number,
  ) {
    return this.coursesService.findAll(query, page, limit);
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
  @UseGuards(JwtAuthGuard)
  findMyCourses(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.coursesService.findMyCourses(user.id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto); 
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}