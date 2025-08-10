import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '../domain/enums/UserRole';
import { JWT_CONSTANTS } from './constants/jwt';
import { AppError } from '../core/errors/infrastructure/AppError';


// JWT Payload Interface
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Token payload interface
interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

// Generate access token
export const generateAccessToken = (payload: TokenPayload): string => {
  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || JWT_CONSTANTS.DEFAULT_EXPIRE) as jwt.SignOptions['expiresIn'],
    issuer: 'blog-backend',
    audience: 'blog-frontend',
    algorithm: JWT_CONSTANTS.ALGORITHM
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
};

// Generate refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshPayload = {
    userId: payload.userId,
    type: 'refresh'
  };

  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || JWT_CONSTANTS.DEFAULT_EXPIRE) as jwt.SignOptions['expiresIn'],
    issuer: 'blog-backend',
    audience: 'blog-frontend',
    algorithm: JWT_CONSTANTS.ALGORITHM
  };

  return jwt.sign(refreshPayload, JWT_REFRESH_SECRET, signOptions);
};

// Generate token pair
export const generateTokenPair = (payload: TokenPayload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpirationTime(process.env.JWT_EXPIRE || JWT_CONSTANTS.DEFAULT_EXPIRE),
    tokenType: 'Bearer' as const
  };
};

// Helper function to parse expiration time to seconds
function parseExpirationTime(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

// Verify access token
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const verifyOptions: VerifyOptions = {
      issuer: 'blog-backend',
      audience: 'blog-frontend',
      algorithms: [JWT_CONSTANTS.ALGORITHM]
    };

    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token süresi dolmuş', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Geçersiz token', 401);
    } else if (error instanceof Error) {
      throw new AppError('Token doğrulama hatası: ' + error.message, 401);
    } else {
      throw new AppError('Token doğrulama hatası', 401);
    }
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
  try {
    const verifyOptions: VerifyOptions = {
      issuer: 'blog-backend',
      audience: 'blog-frontend',
      algorithms: [JWT_CONSTANTS.ALGORITHM]
    };

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, verifyOptions) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Geçersiz refresh token', 401);
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token süresi dolmuş', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Geçersiz refresh token', 401);
    } else if (error instanceof Error) {
      throw new AppError('Refresh token doğrulama hatası: ' + error.message, 401);
    } else {
      throw new AppError('Refresh token doğrulama hatası', 401);
    }
  }
};

// Generate password reset token
export const generatePasswordResetToken = (userId: string): string => {
  const resetPayload = {
    userId,
    type: 'password_reset'
  };

  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || JWT_CONSTANTS.RESET_PASSWORD_EXPIRE) as jwt.SignOptions['expiresIn'],
    issuer: 'blog-backend',
    algorithm: JWT_CONSTANTS.ALGORITHM
  };

  return jwt.sign(resetPayload, JWT_SECRET, signOptions);
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): { userId: string } => {
  try {
    const verifyOptions: VerifyOptions = {
      issuer: 'blog-backend',
      algorithms: [JWT_CONSTANTS.ALGORITHM]
    };

    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as { userId: string; type: string };
    
    if (decoded.type !== 'password_reset') {
      throw new AppError('Geçersiz şifre sıfırlama token\'ı', 400);
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Şifre sıfırlama token\'ı süresi dolmuş', 400);
    } else if (error instanceof Error) {
      throw new AppError('Geçersiz şifre sıfırlama token\'ı: ' + error.message, 400);
    } else {
      throw new AppError('Geçersiz şifre sıfırlama token\'ı', 400);
    }
  }
};

// Generate email verification token
export const generateEmailVerificationToken = (userId: string): string => {
  const emailPayload = {
    userId,
    type: 'email_verification'
  };

  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || JWT_CONSTANTS.EMAIL_VERIFICATION_EXPIRE) as jwt.SignOptions['expiresIn'],
    issuer: 'blog-backend',
    algorithm: JWT_CONSTANTS.ALGORITHM
  };

  return jwt.sign(emailPayload, JWT_SECRET, signOptions);
};

// Verify email verification token
export const verifyEmailVerificationToken = (token: string): { userId: string } => {
  try {
    const verifyOptions: VerifyOptions = {
      issuer: 'blog-backend',
      algorithms: [JWT_CONSTANTS.ALGORITHM]
    };

    const decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as { userId: string; type: string };
    
    if (decoded.type !== 'email_verification') {
      throw new AppError('Geçersiz email doğrulama token\'ı', 400);
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Email doğrulama token\'ı süresi dolmuş', 400);
    } else if (error instanceof Error) {
      throw new AppError('Geçersiz email doğrulama token\'ı: ' + error.message, 400);
    } else {
      throw new AppError('Geçersiz email doğrulama token\'ı', 400);
    }
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader) {
    throw AppError.unauthorized('Authorization header bulunamadı');
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw AppError.badRequest('Geçersiz Authorization header formatı');
  }
  
  return parts[1];
};

// Generate random token (for API keys, etc.)
export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure random string
export const generateSecureRandom = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Get token expiration date
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

// Create token blacklist entry (for logout)
export interface TokenBlacklistEntry {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens periodically
  const expiration = getTokenExpiration(token);
  if (expiration) {
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, expiration.getTime() - Date.now());
  }
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// Decode token without verification (for getting payload)
export const decodeTokenPayload = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
};

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('base64url');
};

// Verify CSRF token
export const verifyCSRFToken = (token: string, sessionToken: string): boolean => {
  // In a real implementation, you'd store and verify CSRF tokens
  // This is a simplified version
  return token.length === 43; // base64url encoded 32 bytes
};