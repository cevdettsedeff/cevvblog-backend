import { IFindAllOptions } from "./Common/IFindAllOptions";
import { IPaginatedResult } from "./Common/IPaginatedResult";

export interface IService<TEntity, TCreateDto, TUpdateDto> {
  getById(id: string): Promise<TEntity | null>;
  getAll(options?: IFindAllOptions): Promise<IPaginatedResult<TEntity>>;
  create(dto: TCreateDto): Promise<TEntity>;
  update(id: string, dto: TUpdateDto): Promise<TEntity>;
  delete(id: string): Promise<boolean>;
}