import { CreateUserDto } from "../../../application/dtos/user/CreateUserDto";
import { UpdateUserDto } from "../../../application/dtos/user/UpdateUserDto";
import { UserResponseDto } from "../../../application/dtos/user/UserResponseDto";
import { IService } from "../IService";

export interface IUserService extends IService<UserResponseDto, CreateUserDto, UpdateUserDto> {
  getByEmail(email: string): Promise<UserResponseDto | null>;
  getByUsername(username: string): Promise<UserResponseDto | null>;
  getAuthors(): Promise<UserResponseDto[]>;
}