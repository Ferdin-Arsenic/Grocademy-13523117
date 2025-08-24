import { 
  Controller, 
  Get, 
  Post, 
  Body,
  Put, 
  Patch, 
  Param, 
  Delete, 
  Req, 
  UseGuards, 
  UseInterceptors, 
  UploadedFiles, 
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';

const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = './public/uploads/';
      
      if (file.fieldname === 'video_content') {
        uploadPath += 'videos';
      } else if (file.fieldname === 'pdf_content') {
        uploadPath += 'pdfs';
      }

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  private readonly logger = new Logger(ModulesController.name);

  constructor(
    private readonly modulesService: ModulesService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video_content', maxCount: 1 },
        { name: 'pdf_content', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
    @UploadedFiles()
    files: {
      video_content?: Express.Multer.File[];
      pdf_content?: Express.Multer.File[];
    },
  ) {
    createModuleDto.courseId = courseId;
    return this.modulesService.create(createModuleDto, files);
  }

   @Get()
  async findAllByCourse(
    @Param('courseId') courseId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '15',
    @Req() req: Request,
  ) {
    const userId = req.user?.['id']; 
    const result = await this.modulesService.findAllByCourse(
      courseId,
      parseInt(page),
      parseInt(limit),
      userId,
    );
    return result;
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async reorder(
    @Param('courseId') courseId: string,
    @Body() reorderModulesDto: ReorderModulesDto
  ) {
    return this.modulesService.reorder(courseId, reorderModulesDto);
  }
}

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class StandaloneModulesController {
  private readonly logger = new Logger(StandaloneModulesController.name);

  constructor(
    private readonly modulesService: ModulesService,
    private readonly prisma: PrismaService
  ) {}
  
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const user = req.user as { id: string; role?: string };
      
      this.logger.debug(`User accessing module ${id}:`, {
        userId: user?.id,
        userRole: user?.role
      });
      if (user?.role === 'admin') {
        this.logger.debug(`Admin access granted for module ${id}`);
        return this.modulesService.findOne(id, undefined);
      }
      const module = await this.prisma.module.findUnique({
        where: { id },
        select: { courseId: true }
      });

      if (!module) {
        this.logger.warn(`Module ${id} not found`);
        throw new NotFoundException(`Module with ID ${id} not found`);
      }

      this.logger.debug(`Checking purchase for module ${id}, courseId: ${module.courseId}`);

      const purchase = await this.prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: module.courseId,
          },
        },
      });

      this.logger.debug(`Purchase check result for module:`, { purchase });

      if (!purchase) {
        this.logger.warn(`User ${user.id} has not purchased course ${module.courseId} for module ${id}`);
        throw new ForbiddenException("You have not purchased this course");
      }

      return this.modulesService.findOne(id, user.id);
      
    } catch (error) {
      this.logger.error(`Error in findOne:`, {
        error: error.message,
        moduleId: id,
        userId: req.user?.['id']
      });
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video_content', maxCount: 1 },
        { name: 'pdf_content', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async update(
    @Param('id') id: string, 
    @Body() updateModuleDto: UpdateModuleDto,
    @UploadedFiles()
    files?: {
      video_content?: Express.Multer.File[];
      pdf_content?: Express.Multer.File[];
    }
  ) {
    return this.modulesService.update(id, updateModuleDto, files);
  }

  @Patch(':id/complete')
  async completeModule(@Param('id') id: string, @Req() req: Request) {
    this.logger.debug('Complete module request received', {
      moduleId: id,
      user: req.user,
      headers: req.headers.authorization
    });

    try {
      const user = req.user as { id: string };
      
      if (!user || !user.id) {
        this.logger.error('No user found in request');
        throw new ForbiddenException('Authentication required');
      }
      
      this.logger.debug('Processing completion for', {
        moduleId: id,
        userId: user.id
      });
      
      return this.modulesService.completeModule(id, user.id);
    } catch (error) {
      this.logger.error('Error in completeModule:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.modulesService.remove(id);
  }
}