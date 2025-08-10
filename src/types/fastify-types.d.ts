import '@fastify/jwt';
import { Container } from 'inversify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email?: string;
      username?: string;
      role?: string;
    };

    user: {
      id: string;
      email: string;
      username: string;
      role: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    file(): Promise<MultipartFile | undefined>; 
    files(): AsyncIterableIterator<MultipartFile>;
    container: Container; 
  }
}