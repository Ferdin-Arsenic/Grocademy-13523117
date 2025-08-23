import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createCourseDto: CreateCourseDto, filePath: string | null) {
    const existingCourse = await this.prisma.course.findFirst({
        where: { 
            title: { 
                equals: createCourseDto.title,
                mode: 'insensitive'
            } 
        },
    });

    if (existingCourse) {
        throw new ConflictException(`Course with title "${createCourseDto.title}" already exists.`);
    }

    const topicsLowerCase = createCourseDto.topics.map(topic => topic.toLowerCase());
    await this.cacheManager.del('ALL_COURSES');
    return this.prisma.course.create({
      data: {
        ...createCourseDto,
        topics: topicsLowerCase, 
        price: Number(createCourseDto.price), 
        thumbnailImage: filePath,
      },
    });
  }
  
  async findAll(
    query?: string,
    page: number = 1,
    limit: number = 15,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.CourseWhereInput = query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { instructor: { contains: query, mode: 'insensitive' } },
            { topics: { has: query.toLowerCase() } },
          ],
        }
      : {};

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const courses = await this.prisma.course.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy,
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
      include: {
        modules: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async buyCourse(courseId: string, userId: string) {
    const [course, user] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: courseId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingPurchase = await this.prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });

    if (existingPurchase) {
        throw new BadRequestException('You have already purchased this course.');
    }
    if (user.balance < course.price) {
      throw new BadRequestException('Insufficient balance');
    }

    const [updatedUser] = await this.prisma.$transaction([
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
      new_balance: updatedUser.balance,
    };
  }

  async findMyCourses(userId: string) {
    const userCourses = await this.prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            _count: {
              select: { modules: true },
            },
          },
        },
      },
    });

    const coursesWithProgress = await Promise.all(
      userCourses.map(async ({ course }) => {
        const totalModules = course._count.modules;
        const completedModulesCount = await this.prisma.userModuleCompletion.count({
          where: {
            userId: userId,
            module: {
              courseId: course.id,
            },
          },
        });

        const progressPercentage =
          totalModules > 0
            ? (completedModulesCount / totalModules) * 100
            : 0;
        delete (course as any)._count;

        return {
          ...course,
          progress_percentage: Math.round(progressPercentage),
        };
      }),
    );

    return coursesWithProgress;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    if (updateCourseDto.topics) {
      updateCourseDto.topics = updateCourseDto.topics.map(topic => topic.toLowerCase());
    }

    await this.cacheManager.del('ALL_COURSES');
    
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { price: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const purchases = await this.prisma.userCourse.findMany({
      where: { courseId: id },
      select: { userId: true },
    });

    await this.prisma.$transaction(async (prisma) => {
      if (purchases.length > 0) {
        const userIds = purchases.map(p => p.userId);
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            balance: {
              increment: course.price,
            },
          },
        });
      }

      await prisma.userCourse.deleteMany({
        where: { courseId: id },
      });

      await prisma.course.delete({
        where: { id },
      });
    });

    await this.cacheManager.del('ALL_COURSES');

    return { message: `Course with ID ${id} and all related purchases have been deleted. Refunds have been issued.` };
  }
}