import { IPagination } from './IPagination';

export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPagination;
}