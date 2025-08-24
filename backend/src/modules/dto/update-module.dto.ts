import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
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