import { Algorithm } from 'jsonwebtoken';

export const JWT_CONSTANTS = {
  DEFAULT_EXPIRE: '15m',
  REFRESH_EXPIRE: '7d' ,
  RESET_PASSWORD_EXPIRE: '1h',
  EMAIL_VERIFICATION_EXPIRE: '1d',
  ALGORITHM: 'HS256' as Algorithm, 
};