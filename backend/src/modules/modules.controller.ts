import {Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import type { Request } from 'express';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
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