import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djl2x1rhf',
  api_key: process.env.CLOUDINARY_API_KEY || '768448229211299',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'xWD75BYkKuScQVd7SsEPvdVCduU',
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 'local_fallback';
  isWorking: boolean;
  bytes?: number;
  format?: string;
  warning?: string;
}

export interface CloudinaryStatusResult {
  configured: boolean;
  cloudName: string;
  isActionDisabled: boolean;
  creditsUsed: number;
  creditsLimit: number;
  creditsPercent: number;
  plan: string;
  message: string;
}

const localUploadDir = path.resolve(process.cwd(), 'uploads/documents');

// Ensure local fallback directory exists
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

export const cloudinaryService = {
  /**
   * Check Cloudinary connection & credit usage status
   */
  getAccountStatus: async (): Promise<CloudinaryStatusResult> => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'djl2x1rhf';
    try {
      const usage = await cloudinary.api.usage();
      const creditsUsed = usage.credits?.usage ?? 0;
      const creditsLimit = usage.credits?.limit ?? 25;
      const creditsPercent = usage.credits?.used_percent ?? 0;
      const isActionDisabled = creditsPercent > 100;

      return {
        configured: true,
        cloudName,
        isActionDisabled,
        creditsUsed,
        creditsLimit,
        creditsPercent,
        plan: usage.plan || 'Free',
        message: isActionDisabled
          ? `Cloudinary credit quota exceeded (${creditsPercent}% used). Auto-fallback to local secure storage active.`
          : 'Cloudinary CDN active and operational.',
      };
    } catch (err: any) {
      return {
        configured: true,
        cloudName,
        isActionDisabled: true,
        creditsUsed: 0,
        creditsLimit: 25,
        creditsPercent: 100,
        plan: 'Free',
        message: err.message || 'Cloudinary usage check returned warning. Fallback storage ready.',
      };
    }
  },

  /**
   * Upload image (base64 string or data URI) to Cloudinary
   * Falls back gracefully to local disk storage if Cloudinary quota is exceeded
   */
  uploadImage: async (
    imagePayload: string,
    folder: string = 'drivemate/documents',
    filenamePrefix: string = 'doc'
  ): Promise<CloudinaryUploadResult> => {
    if (!imagePayload) {
      throw new Error('No image payload provided for upload');
    }

    // 1. If payload is already a hosted URL or local /uploads path, return it immediately
    if (
      imagePayload.startsWith('http://') ||
      imagePayload.startsWith('https://') ||
      imagePayload.startsWith('/uploads/') ||
      imagePayload.startsWith('uploads/')
    ) {
      return {
        url: imagePayload,
        publicId: `${folder}/${filenamePrefix}`,
        provider: imagePayload.includes('cloudinary') ? 'cloudinary' : 'local_fallback',
        isWorking: true,
      };
    }

    // 2. Attempt direct Cloudinary upload
    try {
      const uploadOptions: Record<string, any> = {
        folder,
        resource_type: 'image',
        overwrite: true,
      };

      const result: UploadApiResponse = await cloudinary.uploader.upload(
        imagePayload,
        uploadOptions
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
        isWorking: true,
        bytes: result.bytes,
        format: result.format,
      };
    } catch (cloudErr: any) {
      console.warn(
        `⚠️ [CloudinaryService] Upload note (${cloudErr.message}). Engaging resilient local storage fallback.`
      );

      // 3. Fallback to resilient local secure storage
      try {
        let base64Data = imagePayload;
        let ext = '.jpg';

        if (imagePayload.startsWith('data:image/')) {
          const mimeMatch = imagePayload.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
          if (mimeMatch) {
            ext = `.${mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1]}`;
            base64Data = imagePayload.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
          }
        }

        const randomHex = crypto.randomBytes(8).toString('hex');
        const filename = `${filenamePrefix}_${Date.now()}_${randomHex}${ext}`;
        const filePath = path.join(localUploadDir, filename);

        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        const localUrl = `/uploads/documents/${filename}`;

        return {
          url: localUrl,
          publicId: filename,
          provider: 'local_fallback',
          isWorking: true,
          bytes: buffer.length,
          format: ext.replace('.', ''),
          warning: 'Stored via secure storage vault (Cloudinary quota fallback).',
        };
      } catch (localErr: any) {
        throw new Error(`Failed to store image in both Cloudinary and local storage: ${localErr.message}`);
      }
    }
  },

  /**
   * Verify whether an image URL is accessible and operational
   */
  verifyImageAccessible: async (imageUrl: string): Promise<{ accessible: boolean; provider: string; sizeBytes?: number }> => {
    if (!imageUrl) return { accessible: false, provider: 'none' };
    if (imageUrl.startsWith('/uploads/')) {
      const filename = path.basename(imageUrl);
      const filePath = path.join(localUploadDir, filename);
      const exists = fs.existsSync(filePath);
      const sizeBytes = exists ? fs.statSync(filePath).size : 0;
      return { accessible: exists, provider: 'local_fallback', sizeBytes };
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const head = await axios.head(imageUrl, { timeout: 5000 });
        const provider = imageUrl.includes('cloudinary') ? 'cloudinary' : 'remote';
        return { accessible: head.status >= 200 && head.status < 400, provider };
      } catch (_) {
        return { accessible: false, provider: 'remote' };
      }
    }
    return { accessible: false, provider: 'unknown' };
  },
};

export default cloudinaryService;
