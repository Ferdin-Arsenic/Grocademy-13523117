import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '' || value === 'undefined') {
      return undefined;
    }
    return typeof value === 'string' ? parseInt(value, 10) : value;
  })
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  videoContent?: string;

  @IsOptional()
  @IsString()
  pdfContent?: string;

  @IsOptional()
  @IsString()
  videoOriginalName?: string;

  @IsOptional()
  @IsString()
  pdfOriginalName?: string;
}