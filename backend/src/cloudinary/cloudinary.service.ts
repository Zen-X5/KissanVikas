import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isCloudinaryConfigured = false;
  private uploadCount = 0;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret && !cloudName.includes('your_cloud_name')) {
      this.isCloudinaryConfigured = true;
      this.logger.log(`☁️ [CLOUDINARY] Cloudinary initialized for cloud: "${cloudName}"`);
    } else {
      this.logger.log('💻 [STORAGE] Cloudinary keys not detected. Using local media storage fallback.');
    }
  }

  /**
   * Uploads an image to Cloudinary if configured; otherwise returns the local URL.
   * @param localUrl e.g. "/media/surveys/66bc1234.../F-000001.jpg"
   * @param missionId e.g. "66bc1234567890abcdef1234"
   * @param frameId e.g. "F-000001"
   */
  async processFrameImage(localUrl: string, missionId: string, frameId: string): Promise<string> {
    if (!this.isCloudinaryConfigured) {
      return localUrl;
    }

    try {
      const baseDir = path.dirname(path.dirname(path.dirname(path.dirname(__filename))));
      const relativePath = localUrl.startsWith('/') ? localUrl.slice(1) : localUrl;
      const physicalPath = path.join(baseDir, 'simulation', relativePath);

      if (fs.existsSync(physicalPath)) {
        const result: UploadApiResponse = await cloudinary.uploader.upload(physicalPath, {
          folder: `kissanvikas/surveys/${missionId}`,
          public_id: frameId,
          overwrite: true,
          resource_type: 'image',
        });

        this.uploadCount += 1;
        this.logger.log(
          `☁️ [CLOUDINARY UPLOADED #${this.uploadCount}] Frame: ${frameId} | Mission: ${missionId} -> ${result.secure_url}`
        );

        return result.secure_url;
      }
    } catch (err) {
      this.logger.warn(`⚠️ Cloudinary upload failed for ${frameId} (${err.message}). Using local URL fallback.`);
    }

    return localUrl;
  }

  getUploadCount(): number {
    return this.uploadCount;
  }
}
