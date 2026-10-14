import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const MIME_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
  'image/webp': (buffer) =>
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP',
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export interface ImageUploadFile {
  buffer: Buffer;
  mimetype: string;
}

export interface StoredImage {
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class ImageStorageService {
  private getLocalStorageRoot(): string {
    return resolve(process.env.IMAGE_STORAGE_DIR || 'uploads');
  }

  async upload(file: ImageUploadFile, user_id: number): Promise<string> {
    if (!MIME_SIGNATURES[file.mimetype]?.(file.buffer)) {
      throw new BadRequestException(
        'Only valid JPEG, PNG or WebP images are supported',
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const configuredCredentials = [cloudName, apiKey, apiSecret].filter(Boolean);
    if (configuredCredentials.length > 0 && configuredCredentials.length < 3) {
      throw new ServiceUnavailableException(
        'Cloudinary configuration is incomplete',
      );
    }

    if (configuredCredentials.length === 0) {
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
        throw new ServiceUnavailableException(
          'Cloudinary must be configured for image uploads in this environment',
        );
      }

      const extension = IMAGE_EXTENSIONS[file.mimetype];
      const fileName = `${randomUUID()}${extension}`;
      const imageDirectory = resolve(this.getLocalStorageRoot(), String(user_id));
      await mkdir(imageDirectory, { recursive: true, mode: 0o700 });
      await writeFile(resolve(imageDirectory, fileName), file.buffer, {
        flag: 'wx',
        mode: 0o600,
      });
      return `/api/clothing/images/${user_id}/${fileName}`;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    return new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `digital-wardrobe/users/${user_id}`,
          public_id: randomUUID(),
          resource_type: 'image',
          type: 'authenticated',
          allowed_formats: ['jpg', 'png', 'webp'],
        },
        (error, result) => {
          if (error) {
            reject(new ServiceUnavailableException('Image upload failed'));
            return;
          }
          if (!result?.public_id) {
            reject(new ServiceUnavailableException('Image storage returned no asset ID'));
            return;
          }
          resolve(
            `/api/clothing/images/${user_id}?asset=${encodeURIComponent(result.public_id)}`,
          );
        },
      );
      upload.end(file.buffer);
    });
  }

  async readCloudinary(user_id: number, public_id: string): Promise<StoredImage> {
    const prefix = `digital-wardrobe/users/${user_id}/`;
    if (
      typeof public_id !== 'string' ||
      !public_id.startsWith(prefix) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        public_id.slice(prefix.length),
      )
    ) {
      throw new NotFoundException('Image not found');
    }

    const credentials = this.getCloudinaryCredentials();
    cloudinary.config(credentials);
    const imageUrl = cloudinary.url(public_id, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      resource_type: 'image',
    });
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      throw new ServiceUnavailableException('Image storage could not serve this image');
    }

    const mimetype = response.headers.get('content-type')?.split(';', 1)[0];
    if (!mimetype || !IMAGE_EXTENSIONS[mimetype]) {
      throw new ServiceUnavailableException('Image storage returned an unsupported image type');
    }
    return { buffer: Buffer.from(await response.arrayBuffer()), mimetype };
  }

  async delete(imageUrl: string | null | undefined, user_id: number): Promise<void> {
    if (!imageUrl) return;

    const localPrefix = `/api/clothing/images/${user_id}/`;
    if (imageUrl.startsWith(localPrefix)) {
      const fileName = imageUrl.slice(localPrefix.length);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(fileName)) {
        return;
      }
      try {
        await unlink(resolve(this.getLocalStorageRoot(), String(user_id), fileName));
      } catch (error) {
        if (
          error !== null &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return;
        }
        throw error;
      }
      return;
    }

    const cloudinaryPrefix = `/api/clothing/images/${user_id}?asset=`;
    if (!imageUrl.startsWith(cloudinaryPrefix)) return;
    const public_id = new URL(imageUrl, 'http://wardrobe.local')
      .searchParams.get('asset');
    if (
      !public_id ||
      !new RegExp(
        `^digital-wardrobe/users/${user_id}/[0-9a-f-]{36}$`,
      ).test(public_id)
    ) {
      return;
    }

    cloudinary.config(this.getCloudinaryCredentials());
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: 'image',
      type: 'authenticated',
      invalidate: true,
    });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new ServiceUnavailableException('Image storage could not delete this image');
    }
  }

  async readLocal(user_id: number, fileName: string): Promise<StoredImage> {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
      throw new NotFoundException('Image not found');
    }

    const extension = extname(fileName);
    const mimetype = Object.entries(IMAGE_EXTENSIONS)
      .find(([, allowedExtension]) => allowedExtension === extension)?.[0];
    if (
      !mimetype ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(fileName)
    ) {
      throw new NotFoundException('Image not found');
    }

    const imagePath = resolve(this.getLocalStorageRoot(), String(user_id), fileName);
    try {
      return { buffer: await readFile(imagePath), mimetype };
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new NotFoundException('Image not found');
      }
      throw error;
    }
  }

  private getCloudinaryCredentials() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Cloudinary is not configured');
    }
    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }
}
