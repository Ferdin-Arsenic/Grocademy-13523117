import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Prisma } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

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
            { topics: { has: query } },
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

  async findModulesForUser(courseId: string, userId: string) {
    const purchase = await this.prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (!purchase) {
      throw new ForbiddenException("You have not purchased this course.");
    }

    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    const completions = await this.prisma.userModuleCompletion.findMany({
      where: {
        userId: userId,
        moduleId: { in: modules.map((m) => m.id) },
      },
    });

    const completedModuleIds = new Set(completions.map((c) => c.moduleId));
    const modulesWithCompletion = modules.map((module) => ({
      ...module,
      isCompleted: completedModuleIds.has(module.id),
    }));

    return modulesWithCompletion;
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

  async buyCourse(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.balance < course.price) {
      throw new BadRequestException('Insufficient balance');
    }

    const [, userCourse] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: course.price } },
      }),
      this.prisma.userCourse.create({
        data: {
          userId: userId,
          courseId: courseId,
        },
      }),
    ]);

    return {
      message: 'Course purchased successfully',
      transactionId: userCourse.userId + '-' + userCourse.courseId,
    };
  }

  async findMyCourses(userId: string) {
    const userCourses = await this.prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: true,
      },
    });

    return userCourses.map((uc) => uc.course);
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