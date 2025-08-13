import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';


@Injectable()
export class ModulesService {
    constructor(private prisma: PrismaService) {}

    create(createModuleDto: CreateModuleDto) {
        return this.prisma.module.create({ data: createModuleDto });
    }

    findAllByCourse(courseId: string) {
        return this.prisma.module.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        const module = await this.prisma.module.findUnique({
            where: { id },
        });
        if (!module) {
            throw new Error(`Module with ID ${id} not found`);
        }
        return module;
    }

    async reorder(reorderModulesDto: ReorderModulesDto) {
        const { module_order } = reorderModulesDto;

        const updatePromises = module_order.map((module) =>
            this.prisma.module.update({
            where: { id: module.id },
            data: { order: module.order },
            }),
        );
        await this.prisma.$transaction(updatePromises);

        return { message: 'Modules reordered successfully' };
    }

    async completeModule(moduleId: string, userId: string) {
    // 1. Ambil data modul dan course-nya
    const moduleToComplete = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: true },
    });

    if (!moduleToComplete) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // 2. Validasi kepemilikan course
    const purchase = await this.prisma.userCourse.findUnique({
        where: {
        userId_courseId: {
            userId: userId,
            courseId: moduleToComplete.courseId,
        },
        },
    });

    if (!purchase) {
        throw new ForbiddenException("You have not purchased this course.");
    }
    await this.prisma.userModuleCompletion.upsert({
        where: {
        userId_moduleId: {
            userId: userId,
            moduleId: moduleId,
        },
        },
        update: {},
        create: {
        userId: userId,
        moduleId: moduleId,
        },
    });

    const totalModulesInCourse = await this.prisma.module.count({
        where: { courseId: moduleToComplete.courseId },
    });

    const completedModulesCount = await this.prisma.userModuleCompletion.count({
        where: {
        userId: userId,
        module: {
            courseId: moduleToComplete.courseId,
        },
        },
    });

    const progressPercentage = (completedModulesCount / totalModulesInCourse) * 100;

    return {
        message: "Module marked as complete.",
        is_completed: true,
        course_progress: {
        total_modules: totalModulesInCourse,
        completed_modules: completedModulesCount,
        percentage: Math.round(progressPercentage),
        certificate_url: progressPercentage === 100 ? `http://localhost:3000/certificate/${moduleToComplete.courseId}` : null,
        },
    };
    }

    update(id: string, updateModuleDto: UpdateModuleDto) {
        return this.prisma.module.update({
            where: { id },
            data: updateModuleDto,
        });
    }

    remove(id: string) {
        return this.prisma.module.delete({
            where: { id },
        });
    }
}
