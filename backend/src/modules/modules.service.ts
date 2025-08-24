import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const BASE_URL = 'http://localhost:3000';

@Injectable()
export class ModulesService {
    constructor(private prisma: PrismaService) {}

    private transformModule(module: any, userId?: string) {
        const transformed: any = {
            id: module.id,
            course_id: module.courseId,
            title: module.title,
            description: module.description,
            order: module.order,
            pdf_content: module.pdfContent && !module.pdfContent.startsWith('http') 
                ? `${BASE_URL}${module.pdfContent}` 
                : module.pdfContent,
            video_content: module.videoContent && !module.videoContent.startsWith('http') 
                ? `${BASE_URL}${module.videoContent}` 
                : module.videoContent,
            created_at: module.createdAt,
            updated_at: module.updatedAt,
        };
        if (userId !== undefined) {
            const completion = module.UserModuleCompletion || [];
            transformed.is_completed = completion.length > 0;
        }

        return transformed;
    }

    async create(
        createModuleDto: CreateModuleDto,
        files: {
          video_content?: Express.Multer.File[];
          pdf_content?: Express.Multer.File[];
        },
    ) {
        try {
            if (!createModuleDto.courseId) {
                throw new BadRequestException('courseId is required');
            }
            const courseExists = await this.prisma.course.findUnique({
                where: { id: createModuleDto.courseId }
            });
            
            if (!courseExists) {
                throw new NotFoundException(`Course with ID ${createModuleDto.courseId} not found`);
            }
            let orderValue: number;
            
            if (!createModuleDto.order || createModuleDto.order === undefined) {
                const lastModule = await this.prisma.module.findFirst({
                    where: { courseId: createModuleDto.courseId },
                    orderBy: { order: 'desc' }
                });
                orderValue = lastModule ? lastModule.order + 1 : 1;
            } else {
                orderValue = Number(createModuleDto.order);
                
                if (isNaN(orderValue) || orderValue < 1) {
                    throw new BadRequestException('Order must be a valid positive number');
                }
            }
            const existingModule = await this.prisma.module.findFirst({
                where: {
                    courseId: createModuleDto.courseId,
                    order: orderValue
                }
            });

            if (existingModule) {
                const lastModule = await this.prisma.module.findFirst({
                    where: { courseId: createModuleDto.courseId },
                    orderBy: { order: 'desc' }
                });
                orderValue = lastModule ? lastModule.order + 1 : 1;
            }

            const dataToCreate: any = {
                title: createModuleDto.title,
                description: createModuleDto.description,
                order: orderValue,
                courseId: createModuleDto.courseId,
            };

            if (files.video_content?.[0]) {
                dataToCreate.videoContent = `/uploads/videos/${files.video_content[0].filename}`;
                dataToCreate.videoOriginalName = files.video_content[0].originalname;
            }
            if (files.pdf_content?.[0]) {
                dataToCreate.pdfContent = `/uploads/pdfs/${files.pdf_content[0].filename}`;
                dataToCreate.pdfOriginalName = files.pdf_content[0].originalname;
            }

            const newModule = await this.prisma.module.create({ 
                data: dataToCreate 
            });
            
            return {
                status: "success",
                message: "Module created successfully",
                data: this.transformModule(newModule)
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to create module: ${error.message}`);
        }
    }

    async findAllByCourse(courseId: string, page = 1, limit = 15, userId?: string) {
        try {
            const skip = (page - 1) * limit;
            const totalCount = await this.prisma.module.count({
                where: { courseId }
            });

            if (totalCount === 0) {
                return {
                    status: "success",
                    message: "Modules retrieved successfully",
                    data: [],
                    pagination: {
                        current_page: page,
                        total_pages: 0,
                        total_items: 0,
                    }
                };
            }
            
            let modules: any[];

            if (userId) {
                const rawModules = await this.prisma.$queryRaw`
                    SELECT m.*, 
                        CASE WHEN umc."userId" IS NOT NULL THEN  -- BENAR
                            JSON_BUILD_ARRAY(JSON_BUILD_OBJECT('userId', umc."userId", 'moduleId', umc."moduleId")) -- BENAR
                        ELSE 
                            '[]'::json
                        END as "UserModuleCompletion"
                    FROM "Module" m
                    LEFT JOIN "UserModuleCompletion" umc ON m.id = umc."moduleId" AND umc."userId" = ${userId} -- BENAR
                    WHERE m."courseId" = ${courseId}
                    ORDER BY m."order" ASC
                    LIMIT ${limit} OFFSET ${skip}
                `;
                modules = rawModules as any[];
            }   else {
                modules = await this.prisma.module.findMany({
                    where: { courseId },
                    orderBy: { order: 'asc' },
                    skip,
                    take: limit,
                });
            }
            const transformedModules = modules.map(module => this.transformModule(module, userId));

            return {
                status: "success",
                message: "Modules retrieved successfully",
                data: transformedModules, 
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(totalCount / limit),
                    total_items: totalCount,
                }
            };

        } catch (error) {
            throw new BadRequestException(`Failed to retrieve modules: ${error.message}`);
        }
    }

    async findOne(id: string, userId?: string) {
        try {
            let module: any = null;

            if (userId) {
                const rawModule = await this.prisma.$queryRaw`
                    SELECT m.*, 
                           CASE WHEN umc.user_id IS NOT NULL THEN 
                               JSON_BUILD_ARRAY(JSON_BUILD_OBJECT('userId', umc.user_id, 'moduleId', umc.module_id))
                           ELSE 
                               '[]'::json
                           END as "UserModuleCompletion"
                    FROM "Module" m
                    LEFT JOIN "UserModuleCompletion" umc ON m.id = umc.module_id AND umc.user_id = ${userId}
                    WHERE m.id = ${id}
                    LIMIT 1
                `;
                const result = rawModule as any[];
                module = result[0] || null;
            } else {
                module = await this.prisma.module.findUnique({
                    where: { id }
                });
            }

            if (!module) {
                throw new NotFoundException(`Module with ID ${id} not found`);
            }

            return {
                status: "success",
                message: "Module retrieved successfully",
                data: this.transformModule(module, userId)
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to retrieve module: ${error.message}`);
        }
    }
    
    async reorder(courseId: string, reorderModulesDto: ReorderModulesDto) {
        try {
            const { module_order } = reorderModulesDto;
            const moduleIds = module_order.map(m => m.id);
            const modules = await this.prisma.module.findMany({
                where: {
                    id: { in: moduleIds },
                    courseId: courseId
                }
            });

            if (modules.length !== moduleIds.length) {
                throw new BadRequestException('Some modules do not belong to this course');
            }

            const updatePromises = module_order.map((module) =>
                this.prisma.module.update({
                    where: { id: module.id },
                    data: { order: module.order },
                }),
            );

            await this.prisma.$transaction(updatePromises);

            return {
                status: "success",
                message: "Modules reordered successfully",
                data: {
                    module_order: module_order
                }
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to reorder modules: ${error.message}`);
        }
    }

    async completeModule(moduleId: string, userId: string) {
        try {
            const moduleToComplete = await this.prisma.module.findUnique({ 
                where: { id: moduleId }, 
                include: { course: true }, 
            });

            if (!moduleToComplete) { 
                throw new NotFoundException(`Module with ID ${moduleId} not found`); 
            }

            const purchase = await this.prisma.userCourse.findUnique({ 
                where: { 
                    userId_courseId: { 
                        userId: userId, 
                        courseId: moduleToComplete.courseId, 
                    }, 
                }, 
            });

            if (!purchase) { 
                throw new ForbiddenException("You have not purchased this course"); 
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

            const [totalModulesInCourse, completedModulesCount] = await Promise.all([
                this.prisma.module.count({ 
                    where: { courseId: moduleToComplete.courseId }, 
                }),
                this.prisma.userModuleCompletion.count({ 
                    where: { 
                        userId: userId, 
                        module: { 
                            courseId: moduleToComplete.courseId, 
                        }, 
                    }, 
                })
            ]);

            const progressPercentage = (completedModulesCount / totalModulesInCourse) * 100;
            const certificateUrl = progressPercentage === 100 
                ? `http://localhost:3000/certificate/${moduleToComplete.courseId}` 
                : null;

            return { 
                status: "success", 
                message: "Module marked as complete", 
                data: { 
                    module_id: moduleId, 
                    is_completed: true, 
                    course_progress: { 
                        total_modules: totalModulesInCourse, 
                        completed_modules: completedModulesCount, 
                        percentage: Math.round(progressPercentage), 
                    },
                    certificate_url: certificateUrl
                } 
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(`Failed to complete module: ${error.message}`);
        }
    }

    async update(id: string, updateModuleDto: UpdateModuleDto, files?: { video_content?: Express.Multer.File[]; pdf_content?: Express.Multer.File[]; }) {
        try {
            const module = await this.prisma.module.findUnique({ where: { id } });
            if (!module) {
                throw new NotFoundException(`Module with ID ${id} not found`);
            }

            const dataToUpdate: any = { ...updateModuleDto };
            const videoFile = files?.video_content?.[0];
            if (videoFile) {
                dataToUpdate.videoContent = `/uploads/videos/${videoFile.filename}`;
                dataToUpdate.videoOriginalName = videoFile.originalname;
            }

            const pdfFile = files?.pdf_content?.[0];
            if (pdfFile) {
                dataToUpdate.pdfContent = `/uploads/pdfs/${pdfFile.filename}`;
                dataToUpdate.pdfOriginalName = pdfFile.originalname;
            }

            const updatedModule = await this.prisma.module.update({
                where: { id },
                data: dataToUpdate,
            });

            return {
                status: "success",
                message: "Module updated successfully",
                data: this.transformModule(updatedModule)
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to update module: ${error.message}`);
        }
    }

    async remove(id: string) {
        try {
            const existingModule = await this.prisma.module.findUnique({
                where: { id }
            });

            if (!existingModule) {
                throw new NotFoundException(`Module with ID ${id} not found`);
            }

            await this.prisma.module.delete({ 
                where: { id }, 
            });

            return null;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to delete module: ${error.message}`);
        }
    }
}