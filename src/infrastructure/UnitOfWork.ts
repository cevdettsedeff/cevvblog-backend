import { PrismaClient } from "@prisma/client";
import { IUnitOfWork } from "../core/interfaces/IUnitOfWork";
import { inject, injectable } from "inversify";
import { TYPES } from "../core/container/types";
import { IUserRepository } from "../core/interfaces/Repositories/IUserRepository ";
import { ICategoryRepository } from "../core/interfaces/Repositories/ICategoryRepository";
import { IBlogPostRepository } from "../core/interfaces/Repositories/IBlogPostRepository";
import { ICommentRepository } from "../core/interfaces/Repositories/ICommentRepository";

type PrismaTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">;

@injectable()
export class UnitOfWork implements IUnitOfWork {
  private transactionClient: PrismaClient | null = null;

  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.IUserRepository) public users: IUserRepository,
    @inject(TYPES.ICategoryRepository) public categories: ICategoryRepository,
    @inject(TYPES.IBlogPostRepository) public blogPosts: IBlogPostRepository,
    @inject(TYPES.ICommentRepository) public comments: ICommentRepository
  ) {}

  async begin(): Promise<void> {
   if (this.transactionClient) {
      throw new Error('Transaction already started');
    }
    
    this.transactionClient = await new Promise<PrismaTransactionClient>((resolve, reject) => {
      this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
        resolve(tx);
        return tx;
      }).catch(reject);
    });
    
    // Set transaction client on repositories
    //this.users.setTransactionClient(this.transactionClient);
    //this.categories.setTransactionClient(this.transactionClient);
    //this.blogPosts.setTransactionClient(this.transactionClient);
    //this.comments.setTransactionClient(this.transactionClient);
  }

  async commit(): Promise<void> {
    // In Prisma, the transaction is automatically committed when the callback succeeds
    // So we just need to clean up
    await this.dispose();
  }

  async rollback(): Promise<void> {
    // In Prisma, the transaction is automatically rolled back if an error is thrown
    // So we just need to clean up
    await this.dispose();
  }

  async dispose(): Promise<void> {
    // Clear transaction client from all repositories
    //this.users.setTransactionClient(null);
    //this.categories.setTransactionClient(null);
    //this.blogPosts.setTransactionClient(null);
    //this.comments.setTransactionClient(null);
    this.transactionClient = null;
  }
}