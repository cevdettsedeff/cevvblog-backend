import { config } from "../../config/env";
import { IImageService } from "../../core/interfaces/Services/IImageService";
import logger from "../../utils/logger";
import { injectable } from 'inversify';
import * as Minio from 'minio';

@injectable()
export class ImageService implements IImageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.minio.bucketName;
    this.minioClient = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
    
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`Created MinIO bucket: ${this.bucketName}`);
        
        // Set bucket policy for public read access to images
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        logger.info(`Set public read policy for bucket: ${this.bucketName}`);
      }
    } catch (error) {
      logger.error('Error initializing MinIO bucket:', error);
      throw error;
    }
  }

  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const uniqueFileName = this.generateUniqueFileName(fileName);
      
      await this.minioClient.putObject(
        this.bucketName,
        uniqueFileName,
        file,
        file.length,
        {
          'Content-Type': contentType,
          'Cache-Control': 'max-age=31536000', // 1 year cache
        }
      );

      logger.info(`Image uploaded successfully: ${uniqueFileName}`);
      return this.getImageUrl(uniqueFileName);
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  async uploadMultipleImages(files: Array<{ buffer: Buffer; fileName: string; contentType: string }>): Promise<string[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file.buffer, file.fileName, file.contentType)
    );
    
    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  async deleteImage(fileName: string): Promise<boolean> {
    try {
      // Extract filename from URL if full URL is provided
      const objectName = this.extractFileNameFromUrl(fileName);
      
      await this.minioClient.removeObject(this.bucketName, objectName);
      logger.info(`Image deleted successfully: ${objectName}`);
      return true;
    } catch (error) {
      logger.error('Error deleting image:', error);
      return false;
    }
  }

  async deleteMultipleImages(fileNames: string[]): Promise<boolean[]> {
    const deletePromises = fileNames.map(fileName => this.deleteImage(fileName));
    return await Promise.all(deletePromises);
  }

  getImageUrl(fileName: string): string {
    const protocol = config.minio.useSSL ? 'https' : 'http';
    const port = config.minio.port === 443 || config.minio.port === 80 ? '' : `:${config.minio.port}`;
    return `${protocol}://${config.minio.endPoint}${port}/${this.bucketName}/${fileName}`;
  }

  private generateUniqueFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalFileName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  private extractFileNameFromUrl(fileNameOrUrl: string): string {
    if (fileNameOrUrl.includes('/')) {
      return fileNameOrUrl.split('/').pop() || fileNameOrUrl;
    }
    return fileNameOrUrl;
  }
}