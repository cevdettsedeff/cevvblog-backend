import { IFindAllOptions } from "./Common/IFindAllOptions";
import { IPaginatedResult } from "./Common/IPaginatedResult";

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: IFindAllOptions): Promise<IPaginatedResult<T>>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;

  //setTransactionClient(transactionClient: PrismaTransactionClient | null): void;
}
