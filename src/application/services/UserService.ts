import { inject, injectable } from "inversify";
import { IFindAllOptions } from "../../core/interfaces/Common/IFindAllOptions";
import { IPaginatedResult } from "../../core/interfaces/Common/IPaginatedResult";
import { IUserRepository } from "../../core/interfaces/Repositories/IUserRepository ";
import { CreateUserDto } from "../dtos/user/CreateUserDto";
import { UpdateUserDto } from "../dtos/user/UpdateUserDto";
import { UserResponseDto } from "../dtos/user/UserResponseDto";
import { TYPES } from "../../core/container/types";
import { IUserService } from "../../core/interfaces/Services/IUserService";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository
  ) {}

  async getById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.mapToDto(user) : null;
  }

  async getAll(options?: IFindAllOptions): Promise<IPaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.findAll(options);
    return {
      data: result.data.map(user => this.mapToDto(user)),
      pagination: result.pagination,
    };
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.create(dto);
    return this.mapToDto(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.update(id, dto);
    return this.mapToDto(user);
  }

  async delete(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async getByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapToDto(user) : null;
  }

  async getByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByUsername(username);
    return user ? this.mapToDto(user) : null;
  }

  async getAuthors(): Promise<UserResponseDto[]> {
    const authors = await this.userRepository.findAuthors();
    return authors.map(author => this.mapToDto(author));
  }

  private mapToDto(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      postsCount: user._count?.blogPosts || 0,
      commentsCount: user._count?.comments || 0,
    };
  }
}