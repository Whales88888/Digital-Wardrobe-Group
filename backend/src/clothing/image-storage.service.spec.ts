import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ImageStorageService } from './image-storage.service';

describe('ImageStorageService', () => {
  const service = new ImageStorageService();
  const originalEnv = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    imageStorageDir: process.env.IMAGE_STORAGE_DIR,
    nodeEnv: process.env.NODE_ENV,
  };

  afterEach(() => {
    const restore = (
      key: string,
      value: string | undefined,
    ) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restore('CLOUDINARY_CLOUD_NAME', originalEnv.cloudName);
    restore('CLOUDINARY_API_KEY', originalEnv.apiKey);
    restore('CLOUDINARY_API_SECRET', originalEnv.apiSecret);
    restore('IMAGE_STORAGE_DIR', originalEnv.imageStorageDir);
    restore('NODE_ENV', originalEnv.nodeEnv);
  });

  it('rejects a file whose signature does not match its declared image type', async () => {
    await expect(
      service.upload(
        { mimetype: 'image/jpeg', buffer: Buffer.from('not an image') },
        4,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports missing Cloudinary configuration instead of silently succeeding', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    process.env.NODE_ENV = 'test';
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

    await expect(
      service.upload({ mimetype: 'image/jpeg', buffer: jpeg }, 4),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('stores and serves images locally for the owning user in development', async () => {
    const storageDirectory = await mkdtemp(join(tmpdir(), 'digital-wardrobe-'));
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    process.env.NODE_ENV = 'development';
    process.env.IMAGE_STORAGE_DIR = storageDirectory;
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    try {
      const imageUrl = await service.upload(
        { mimetype: 'image/png', buffer: png },
        42,
      );
      expect(imageUrl).toMatch(
        /^\/api\/clothing\/images\/42\/[0-9a-f-]{36}\.png$/,
      );
      const fileName = imageUrl.split('/').at(-1);
      expect(fileName).toBeDefined();
      await expect(service.readLocal(42, fileName!)).resolves.toEqual({
        buffer: png,
        mimetype: 'image/png',
      });
      await expect(service.readLocal(43, fileName!)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await service.delete(imageUrl, 42);
      await expect(service.readLocal(42, fileName!)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    } finally {
      await rm(storageDirectory, { recursive: true, force: true });
    }
  });

  it('rejects incomplete Cloudinary credentials instead of silently using local storage', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_API_KEY = 'incomplete';
    delete process.env.CLOUDINARY_API_SECRET;

    await expect(
      service.upload(
        { mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) },
        4,
      ),
    ).rejects.toThrow('Cloudinary configuration is incomplete');
  });
});
