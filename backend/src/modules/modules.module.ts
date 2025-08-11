import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { PrismaModule } from '../prisma/prisma.module'; // <-- TAMBAHKAN IMPORT INI

@Module({
  imports: [PrismaModule], // <-- TAMBAHKAN BAGIAN INI
  controllers: [ModulesController],
  providers: [ModulesService],
})
export class ModulesModule {}