import AWS from 'aws-sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FileUploadOptions, UploadedFile } from '../types';
import crypto from 'crypto';

export class S3Service {
  private static s3 = new AWS.S3({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
  });

  private static bucket = env.AWS_S3_BUCKET;

  /**
   * Upload file to S3
   */
  static async uploadFile(options: FileUploadOptions): Promise<UploadedFile> {
    try {
      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(options.file.mimetype)) {
        throw new Error(`File type ${options.file.mimetype} not allowed`);
      }

      // Validate file size
      if (options.maxSize && options.file.size > options.maxSize) {
        throw new Error(`File size ${options.file.size} exceeds maximum ${options.maxSize}`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = options.file.originalname.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;
      const key = `${options.folder}/${filename}`;

      // Upload to S3
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucket,
          Key: key,
          Body: options.file.buffer,
          ContentType: options.file.mimetype,
          ACL: 'private',
        })
        .promise();

      logger.info(`File uploaded to S3: ${key}`);

      return {
        url: uploadResult.Location,
        key: uploadResult.Key,
        size: options.file.size,
        mimetype: options.file.mimetype,
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  /**
   * Upload KYC document
   */
  static async uploadKYCDocument(file: Express.Multer.File, userId: string) {
    return this.uploadFile({
      file,
      folder: `${env.AWS_S3_KYC_PREFIX}${userId}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });
  }

  /**
   * Upload dispute evidence
   */
  static async uploadDisputeEvidence(file: Express.Multer.File, disputeId: string) {
    return this.uploadFile({
      file,
      folder: `${env.AWS_S3_EVIDENCE_PREFIX}${disputeId}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });
  }

  /**
   * Get signed URL for private file
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });

      return url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();

      logger.info(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      return false;
    }
  }

  /**
   * Delete multiple files from S3
   */
  static async deleteFiles(keys: string[]): Promise<boolean> {
    try {
      await this.s3
        .deleteObjects({
          Bucket: this.bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        })
        .promise();

      logger.info(`${keys.length} files deleted from S3`);
      return true;
    } catch (error) {
      logger.error('Error deleting files from S3:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default S3Service;
