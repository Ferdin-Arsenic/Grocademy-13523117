class ModuleOrderDto {
  id: string;
  order: number;
}

export class ReorderModulesDto {
  module_order: ModuleOrderDto[];
}