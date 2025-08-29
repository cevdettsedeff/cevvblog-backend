import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MinIO configuration interface
interface MinIOConfig {
  enabled: boolean;
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/blog_db',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  },

  // MinIO Configuration with proper typing - Default DISABLED
  minio: {
    enabled: process.env.STORAGE_ENABLED === 'true', // Default DISABLED
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'blog-images',
  } as MinIOConfig,
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Validate MinIO config if enabled
if (config.minio.enabled) {
  const requiredMinIOVars = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'];
  
  for (const envVar of requiredMinIOVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  MinIO enabled but missing ${envVar}, using default value`);
    }
  }
}