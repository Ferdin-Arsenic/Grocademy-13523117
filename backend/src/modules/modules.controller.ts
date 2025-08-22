import {Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, UseInterceptors, UploadedFiles,} from '@nestjs/common';
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
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'videoContent', maxCount: 1 },
        { name: 'pdfContent', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let uploadPath = './public/uploads/';
            
            if (file.fieldname === 'videoContent') {
              uploadPath += 'videos';
            } else if (file.fieldname === 'pdfContent') {
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
      },
    ),
  )
  
  create(
    @Body() createModuleDto: CreateModuleDto,
    @UploadedFiles()
    files: {
      videoContent?: Express.Multer.File[];
      pdfContent?: Express.Multer.File[];
    },
  ) {
    return this.modulesService.create(createModuleDto, files);
  }

  @Get()
  findAllByCourse(@Query('courseId') courseId: string) {
    return this.modulesService.findAllByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post('reorder')
  @UseGuards(RolesGuard)
  @Roles('admin')
  reorder(@Body() reorderModulesDto: ReorderModulesDto) {
    return this.modulesService.reorder(reorderModulesDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Patch(':id/complete')
  completeModule(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.modulesService.completeModule(id, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}