import { Module } from '@nestjs/common';
import { ModulesController, StandaloneModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [ModulesController, StandaloneModulesController],
  providers: [ModulesService, PrismaService],
})
export class ModulesModule {}