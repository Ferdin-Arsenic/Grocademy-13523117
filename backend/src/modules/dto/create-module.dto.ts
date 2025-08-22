export class CreateModuleDto {
  title: string;
  description: string;
  order: number;
  courseId: string;
  videoContent?: string;
  pdfContent?: string; 
  videoOriginalName?: string;
  pdfOriginalName?: string;
}