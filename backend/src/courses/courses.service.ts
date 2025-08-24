import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
const BASE_URL = 'http://localhost:3000'; 

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private transformCourse(course: any) {
    const transformed = {
      ...course,
      thumbnail_image: course.thumbnailImage && !course.thumbnailImage.startsWith('http')
        ? `${BASE_URL}${course.thumbnailImage}`
        : course.thumbnailImage,
    };
    delete transformed.thumbnailImage;

    return transformed;
  }

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

    const newCourse = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        topics: topicsLowerCase,
        price: Number(createCourseDto.price), 
        thumbnailImage: filePath,
      },
    });
    return this.transformCourse(newCourse); 
  }

  async findAll(
      query?: string,
      page: number = 1,
      limit: number = 15,
      sortBy: string = 'createdAt',
      sortOrder: 'asc' | 'desc' = 'desc',
  ) {
      try {
          const cacheKey = `ALL_COURSES_${query}_${page}_${limit}_${sortBy}_${sortOrder}`;

          const cachedData = await this.cacheManager.get(cacheKey);
          if (cachedData) {
              return cachedData;
          }

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

          const orderBy = { [sortBy]: sortOrder };

          const courses = await this.prisma.course.findMany({
              where: whereCondition,
              skip,
              take: limit,
              orderBy,
              include: {
                  _count: {
                      select: { modules: true },
                  },
              },
          });

          const totalItems = await this.prisma.course.count({ where: whereCondition });
          const transformedCourses = courses.map(course => {
              const transformed = this.transformCourse(course);
              return {
                  ...transformed,
                  total_modules: course._count.modules,
              };
          });

          const response = {
              status: "success",
              message: "Courses retrieved successfully",
              data: transformedCourses,
              pagination: {
                  current_page: page,
                  total_pages: Math.ceil(totalItems / limit),
                  total_items: totalItems,
              },
          };
          await this.cacheManager.set(cacheKey, response, 300);

          return response;

      } catch (error) {
          throw new BadRequestException(`Failed to retrieve courses: ${error.message}`);
      }
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
            select: { modules: true }
        }
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    
    const { _count, ...courseData } = course;
    return {
        status: "success",
        message: "Course retrieved successfully",
        data: this.transformCourse({
            ...courseData,
            total_modules: _count.modules
        })
    };
  }
  

  async findAllForUser( userId: string, query?: string, page: number = 1, limit: number = 15, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
    const skip = (page - 1) * limit;
    const userPurchases = await this.prisma.userCourse.findMany({ where: { userId }, select: { courseId: true } });
    const purchasedCourseIds = userPurchases.map(p => p.courseId);
    const whereCondition: Prisma.CourseWhereInput = { ...(query && { OR: [ { title: { contains: query, mode: 'insensitive' } }, { instructor: { contains: query, mode: 'insensitive' } }, { topics: { has: query.toLowerCase() } }, ], }), id: { notIn: purchasedCourseIds, }, };
    const orderBy = { [sortBy]: sortOrder };
    const courses = await this.prisma.course.findMany({ where: whereCondition, skip, take: limit, orderBy });
    const totalItems = await this.prisma.course.count({ where: whereCondition });
    const transformedCourses = courses.map(this.transformCourse);
    return { data: transformedCourses, pagination: { current_page: page, total_pages: Math.ceil(totalItems / limit), total_items: totalItems, }, };
  }
  async findModulesForUser(courseId: string, userId: string) {
    const purchase = await this.prisma.userCourse.findUnique({ where: { userId_courseId: { userId: userId, courseId: courseId, }, }, });
    const modules = await this.prisma.module.findMany({ where: { courseId }, orderBy: { order: 'asc' }, });
    const completions = await this.prisma.userModuleCompletion.findMany({ where: { userId: userId, moduleId: { in: modules.map((m) => m.id) }, }, });
    const completedModuleIds = new Set(completions.map((c) => c.moduleId));
    const modulesWithCompletion = modules.map((module) => ({ ...module, isCompleted: completedModuleIds.has(module.id), }));
    return modulesWithCompletion;
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

    await this.prisma.userCourseBookmark.deleteMany({
      where: {
        userId: userId,
        courseId: courseId,
      },
    });

    const [updatedUser, newPurchase] = await this.prisma.$transaction([
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
      status: "success",
      message: 'Course purchased successfully and removed from bookmarks.',
      data: {
        course_id: courseId,
        user_balance: updatedUser.balance,
        transaction_id: newPurchase.id 
      }
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

    const transformedCourses = coursesWithProgress.map(course => this.transformCourse(course));


    return {
        status: "success",
        message: "My courses retrieved successfully",
        data: transformedCourses,
    };
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, filePath?: string | null) {
    const existingCourse = await this.prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const updateData: any = { ...updateCourseDto };

    if (updateCourseDto.topics) { 
      updateData.topics = updateCourseDto.topics.map(topic => topic.toLowerCase()); 
    }

    if (updateCourseDto.price !== undefined) {
      updateData.price = Number(updateCourseDto.price);
    }

    if (filePath) {
      updateData.thumbnailImage = filePath;
    }

    try {
      await this.cacheManager.del('ALL_COURSES');
      const updatedCourse = await this.prisma.course.update({ 
        where: { id }, 
        data: updateData,
      });

      return {
        status: "success",
        message: "Course updated successfully",
        data: this.transformCourse(updatedCourse)
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this title already exists');
      }
      throw new BadRequestException(`Failed to update course: ${error.message}`);
    }
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

      await prisma.userCourseBookmark.deleteMany({ where: { courseId: id } });
      await prisma.userModuleCompletion.deleteMany({ where: { module: { courseId: id } } });
      await prisma.userCourse.deleteMany({ where: { courseId: id } });
      await prisma.module.deleteMany({ where: { courseId: id } });
      
      await prisma.course.delete({ where: { id } });
    });

    await this.cacheManager.del('ALL_COURSES');

    return { message: `Course with ID ${id} and all related data have been deleted. Refunds have been issued.` };
  }
}