import { Test, TestingModule } from '@nestjs/testing';
import { ClothingController } from './clothing.controller';
import { ClothingService } from './clothing.service';
import { ImageStorageService } from './image-storage.service';

describe('ClothingController', () => {
  let controller: ClothingController;
  const imageStorage = { upload: jest.fn(), readLocal: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClothingController],
      providers: [
        { provide: ClothingService, useValue: {} },
        { provide: ImageStorageService, useValue: imageStorage },
      ],
    }).compile();

    controller = module.get<ClothingController>(ClothingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads an image to the authenticated user directory', async () => {
    imageStorage.upload.mockResolvedValue('https://cloudinary.example/image.webp');

    await expect(
      controller.uploadImage(
        { mimetype: 'image/webp', buffer: Buffer.from('image') },
        { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
      ),
    ).resolves.toEqual({
      image_url: 'https://cloudinary.example/image.webp',
    });
    expect(imageStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ mimetype: 'image/webp' }),
      12,
    );
  });

  it('serves a local image only from the authenticated user directory', async () => {
    imageStorage.readLocal.mockResolvedValue({
      buffer: Buffer.from('png bytes'),
      mimetype: 'image/png',
    });

    const image = await controller.getLocalImage(
      '12',
      '123e4567-e89b-42d3-a456-426614174000.png',
      { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
    );

    expect(image).toBeDefined();
    expect(imageStorage.readLocal).toHaveBeenCalledWith(
      12,
      '123e4567-e89b-42d3-a456-426614174000.png',
    );
  });

  it('does not expose local images belonging to a different user', async () => {
    await expect(
      controller.getLocalImage(
        '13',
        '123e4567-e89b-42d3-a456-426614174000.png',
        { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(imageStorage.readLocal).not.toHaveBeenCalled();
  });
});
