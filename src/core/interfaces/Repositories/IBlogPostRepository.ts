import { BlogPost } from "../../../domain/entities/BlogPost";
import { IFindAllOptions } from "../Common/IFindAllOptions";
import { IPaginatedResult } from "../Common/IPaginatedResult";
import { IRepository } from "../IRepository";

export interface IBlogPostRepository extends IRepository<BlogPost> {
  findBySlug(slug: string): Promise<BlogPost | null>;
  findPublished(options?: IFindAllOptions): Promise<IPaginatedResult<BlogPost>>;
  findByCategory(categoryId: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPost>>;
  findByAuthor(authorId: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPost>>;
  incrementViewCount(id: string): Promise<void>;
  findPopular(limit?: number): Promise<BlogPost[]>;
  findRecent(limit?: number): Promise<BlogPost[]>;
  findByTag(tag: string, options?: IFindAllOptions): Promise<IPaginatedResult<BlogPost>>;
  findDrafts(authorId?: string): Promise<BlogPost[]>;
  findTrending(limit: number, days: number): Promise<BlogPost[]>;
}