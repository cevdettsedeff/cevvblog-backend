import { FastifyInstance } from "fastify";
import { AuthResponseDto } from "../../../application/dtos/auth/AuthResponseDto";
import { LoginDto } from "../../../application/dtos/auth/LoginDto";
import { RegisterDto } from "../../../application/dtos/auth/RegisterDto";

export interface IAuthService {
  login(dto: LoginDto): Promise<AuthResponseDto | null>;
  register(dto: RegisterDto): Promise<AuthResponseDto>;
  generateToken(userId: string, fastify: FastifyInstance): string;
}