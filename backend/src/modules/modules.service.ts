import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';


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
