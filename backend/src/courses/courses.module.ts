import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { PrismaModule } from '../prisma/prisma.module'; // <-- TAMBAHKAN IMPORT INI

@Module({
  imports: [PrismaModule], // <-- TAMBAHKAN BAGIAN INI
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}