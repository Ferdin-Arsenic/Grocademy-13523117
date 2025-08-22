import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CertificateService {
  constructor(private prisma: PrismaService) {}

  async generateCertificate(courseId: string, userId: string): Promise<Buffer> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { modules: true } } },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalModules = course._count.modules;
    const completedModules = await this.prisma.userModuleCompletion.count({
      where: {
        userId,
        module: { courseId },
      },
    });

    if (totalModules === 0 || completedModules < totalModules) {
      throw new ForbiddenException('You have not completed this course yet.');
    }
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const completionDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50,
    });

    const backgroundImagePath = join(process.cwd(), 'src/assets/certificate-background.png');

    try {
      if (!existsSync(backgroundImagePath)) {
        throw new Error('Background image file not found');
      }

      doc.opacity(0.15);
      doc.image(backgroundImagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
        fit: [doc.page.width, doc.page.height],
        align: 'center',
        valign: 'center'
      });

      doc.opacity(1);
    } catch (error) {
      console.warn('Background image not found, using fallback background:', error.message);
      
      doc.opacity(0.05);
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fillColor('#D4AF37')
         .fill();
      doc.opacity(1);
    }
    const goldColor = '#D4AF37'; 
    const blue = '#1E90FF';

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    const contentYStart = 200; 

    doc.fontSize(32)
       .font('Helvetica-Bold')
       .text('Sertifikat Kelulusan', { align: 'center' });
    
    doc.moveDown(1.5);

    doc.fontSize(16)
       .font('Helvetica')
       .text('Dengan ini menyatakan bahwa:', 50, contentYStart, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor(blue)
       .text(`${user.firstName} ${user.lastName}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('black')
       .text('Telah berhasil menyelesaikan kursus:', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(24)
       .font('Helvetica-BoldOblique')
       .fillColor(goldColor)
       .text(`"${course.title}"`, { align: 'center' });
    
    doc.fillColor('black'); 

    const bottomContentY = doc.page.height - 120;

    doc.fontSize(14)
       .font('Helvetica')
       .text(`Instruktur: ${course.instructor}`, 50, bottomContentY, { align: 'center' });

    doc.moveDown(0.5);
    doc.text(`Tanggal Kelulusan: ${completionDate}`, { align: 'center' });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}