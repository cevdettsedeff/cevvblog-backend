import logger from "../utils/logger";
import { config } from "./env";

export class MinioConfig {
  private static instance: MinioConfig;
  private client: any = null;
  private isEnabled: boolean;

  private constructor() {
    // Check if MinIO is enabled - artık type safe
    this.isEnabled = config.minio.enabled && process.env.STORAGE_ENABLED !== "false";

    if (!this.isEnabled) {
      logger.info("📦 MinIO is disabled, using mock storage");
      return;
    }

    try {
      // Only import and initialize MinIO if enabled
      const Minio = require("minio");

      this.client = new Minio.Client({
        endPoint: config.minio.endPoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        accessKey: config.minio.accessKey,
        secretKey: config.minio.secretKey,
      });

      logger.info("🚀 MinIO client initialized");
    } catch (error: unknown) {
      this.handleError("Failed to initialize MinIO client", error);
      this.isEnabled = false;
      this.client = null;
    }
  }

  public static getInstance(): MinioConfig {
    if (!MinioConfig.instance) {
      MinioConfig.instance = new MinioConfig();
    }
    return MinioConfig.instance;
  }

  public getClient(): any {
    if (!this.isEnabled || !this.client) {
      logger.warn("⚠️  MinIO client not available, returning null");
      return null;
    }
    return this.client;
  }

  public isMinioEnabled(): boolean {
    return this.isEnabled && this.client !== null;
  }

  public async initialize(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.info("📦 MinIO initialization skipped (disabled or client unavailable)");
      return;
    }

    try {
      logger.info("🔗 Attempting to connect to MinIO...");

      // Test connection first
      await this.testConnection();

      // Check if bucket exists
      const bucketExists = await this.client.bucketExists(config.minio.bucketName);

      if (!bucketExists) {
        // Create bucket
        await this.client.makeBucket(config.minio.bucketName, "us-east-1");
        logger.info(`✅ Created MinIO bucket: ${config.minio.bucketName}`);

        // Set bucket policy for public read access
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${config.minio.bucketName}/*`],
            },
          ],
        };

        await this.client.setBucketPolicy(config.minio.bucketName, JSON.stringify(policy));

        logger.info(`✅ Set public read policy for bucket: ${config.minio.bucketName}`);
      } else {
        logger.info(`✅ MinIO bucket already exists: ${config.minio.bucketName}`);
      }

      logger.info("🎉 MinIO initialized successfully");
    } catch (error: unknown) {
      this.handleError("Failed to initialize MinIO", error, {
        endpoint: config.minio.endPoint,
        port: config.minio.port,
      });

      this.isEnabled = false;
      this.client = null;

      if (process.env.NODE_ENV === "development") {
        logger.info("📦 Development mode: Skipping MinIO, using mock storage.");
        return; // Hata fırlatma, sessizce çık
      }

      throw error; // Prod ortamda hata fırlat
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error("MinIO client not initialized");
    }

    // Simple connection test
    await this.client.listBuckets();
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.bucketExists(config.minio.bucketName);
      return true;
    } catch (error: unknown) {
      this.handleError("MinIO health check failed", error);
      return false;
    }
  }

  // Error handling helper method
  private handleError(message: string, error: unknown, additionalInfo?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as any)?.code || "UNKNOWN";

    if (process.env.NODE_ENV === "development") {
      // Dev ortamında error yerine sadece info olarak yaz
      logger.info(`🚧 ${message} (dev mode - skipping MinIO):`, {
        message: errorMessage,
        code: errorCode,
        ...additionalInfo,
      });
    } else {
      logger.error(`❌ ${message}:`, {
        message: errorMessage,
        code: errorCode,
        ...additionalInfo,
      });
    }
  }

  // Mock storage methods for when MinIO is disabled
  public async mockUpload(fileName: string): Promise<{ url: string; key: string }> {
    logger.info(`📁 Mock upload: ${fileName}`);
    return {
      url: `/mock-uploads/${fileName}`,
      key: fileName,
    };
  }

  public async mockDelete(key: string): Promise<boolean> {
    logger.info(`🗑️  Mock delete: ${key}`);
    return true;
  }

  public getMockUrl(key: string): string {
    return `/mock-uploads/${key}`;
  }

  // Real MinIO operations (when enabled)
  public async uploadFile(file: Buffer, fileName: string, contentType?: string): Promise<{ url: string; key: string }> {
    if (!this.isMinioEnabled()) {
      return this.mockUpload(fileName);
    }

    try {
      const key = `uploads/${Date.now()}-${fileName}`;

      await this.client.putObject(
        config.minio.bucketName,
        key,
        file,
        file.length,
        contentType ? { "Content-Type": contentType } : undefined,
      );

      const url = `${config.minio.useSSL ? "https" : "http"}://${config.minio.endPoint}:${config.minio.port}/${config.minio.bucketName}/${key}`;

      logger.info(`✅ File uploaded to MinIO: ${key}`);
      return { url, key };
    } catch (error: unknown) {
      this.handleError("Failed to upload file to MinIO", error);
      throw error;
    }
  }

  public async deleteFile(key: string): Promise<boolean> {
    if (!this.isMinioEnabled()) {
      return this.mockDelete(key);
    }

    try {
      await this.client.removeObject(config.minio.bucketName, key);
      logger.info(`✅ File deleted from MinIO: ${key}`);
      return true;
    } catch (error: unknown) {
      this.handleError("Failed to delete file from MinIO", error);
      return false;
    }
  }
}
