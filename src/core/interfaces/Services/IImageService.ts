export interface IImageService {
  uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string>;
  uploadMultipleImages(files: Array<{ buffer: Buffer; fileName: string; contentType: string }>): Promise<string[]>;
  deleteImage(fileName: string): Promise<boolean>;
  deleteMultipleImages(fileNames: string[]): Promise<boolean[]>;
  getImageUrl(fileName: string): string;
  generateThumbnail?(buffer: Buffer, size?: number): Promise<Buffer>;
}