import { IsArray, IsString, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleOrderDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(1)
  order: number;
}

export class ReorderModulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleOrderDto)
  module_order: ModuleOrderDto[];
}