import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { FileUploadOptions, UploadedFile } from '../types';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload file to Cloudinary
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
      const filename = `${timestamp}-${randomString}`;

      // Determine resource type based on mimetype
      const resourceType = options.file.mimetype.startsWith('image/')
        ? 'image'
        : options.file.mimetype === 'application/pdf'
        ? 'image' // Cloudinary can handle PDFs as images
        : 'raw';

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder,
            public_id: filename,
            resource_type: resourceType as any,
            type: 'private', // Make files private by default
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(options.file.buffer);
      });

      logger.info(`File uploaded to Cloudinary: ${options.folder}/${filename}`);

      return {
        url: result.secure_url,
        key: result.public_id,
        size: options.file.size,
        mimetype: options.file.mimetype,
      };
    } catch (error) {
      logger.error('Error uploading file to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload KYC document
   */
  static async uploadKYCDocument(file: Express.Multer.File, userId: string) {
    return this.uploadFile({
      file,
      folder: `maya-global-pay/kyc/${userId}`,
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
      folder: `maya-global-pay/evidence/${disputeId}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: Express.Multer.File, userId: string) {
    const result = await this.uploadFile({
      file,
      folder: `maya-global-pay/profiles/${userId}`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      maxSize: 5 * 1024 * 1024, // 5MB
    });

    // Get optimized URL with transformations
    const optimizedUrl = cloudinary.url(result.key, {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });

    return {
      ...result,
      url: optimizedUrl,
    };
  }

  /**
   * Get signed URL for private file
   */
  static getSignedUrl(publicId: string, expiresIn: number = 3600): string {
    try {
      const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

      const url = cloudinary.url(publicId, {
        type: 'private',
        sign_url: true,
        expires_at: timestamp,
      });

      return url;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);

      logger.info(`File deleted from Cloudinary: ${publicId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting file from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  static async deleteFiles(publicIds: string[]): Promise<boolean> {
    try {
      await cloudinary.api.delete_resources(publicIds);

      logger.info(`${publicIds.length} files deleted from Cloudinary`);
      return true;
    } catch (error) {
      logger.error('Error deleting files from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(publicId: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(publicId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(publicId: string) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
      };
    } catch (error) {
      logger.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    }
  ): string {
    return cloudinary.url(publicId, {
      width: options?.width || 800,
      height: options?.height,
      crop: options?.crop || 'limit',
      quality: options?.quality || 'auto',
      fetch_format: 'auto',
    });
  }
}

export default CloudinaryService;
