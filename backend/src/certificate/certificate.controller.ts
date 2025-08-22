import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import type { Request } from 'express';
import type { Response } from 'express';

@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get(':courseId')
  @UseGuards(JwtAuthGuard)
  async downloadCertificate(
    @Param('courseId') courseId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as { id: string };
    const pdfBuffer = await this.certificateService.generateCertificate(
      courseId,
      user.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=sertifikat-${courseId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}