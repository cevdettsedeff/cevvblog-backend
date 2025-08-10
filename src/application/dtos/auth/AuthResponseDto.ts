export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
  token: string;
}