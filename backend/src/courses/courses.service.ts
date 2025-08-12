import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  create(createCourseDto: CreateCourseDto) {
    return this.prisma.course.create({ data: createCourseDto });
  }

  async findAll(query?: string, page: number = 1, limit: number = 15) {
      const skip = (page - 1) * limit;

      const whereCondition: Prisma.CourseWhereInput = query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { instructor: { contains: query, mode: 'insensitive' } },
              { topics: { has: query } }
            ],
          }
        : {};

      const courses = await this.prisma.course.findMany({
        where: whereCondition,
        skip,
        take: limit,
      });

      const totalItems = await this.prisma.course.count({ where: whereCondition });

      return {
        data: courses,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
        },
      };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) {
      throw new Error(`Course with ID ${id} not found`);
    }
    return course;
  }

  update(id: string, updateCourseDto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  remove(id: string) {
    return this.prisma.course.delete({
      where: { id },
    });
  }
}