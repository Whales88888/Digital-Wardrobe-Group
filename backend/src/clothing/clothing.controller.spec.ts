import { Test, TestingModule } from '@nestjs/testing';
import { ClothingController } from './clothing.controller';
import { ClothingService } from './clothing.service';
import { ImageStorageService } from './image-storage.service';

describe('ClothingController', () => {
  let controller: ClothingController;
  const imageStorage = {
    upload: jest.fn(),
    readLocal: jest.fn(),
    readCloudinary: jest.fn(),
    delete: jest.fn(),
  };
  const clothingService = {
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClothingController],
      providers: [
        { provide: ClothingService, useValue: clothingService },
        { provide: ImageStorageService, useValue: imageStorage },
      ],
    }).compile();

    controller = module.get<ClothingController>(ClothingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads an image to the authenticated user directory', async () => {
    imageStorage.upload.mockResolvedValue('/api/clothing/images/12?asset=private-image');

    await expect(
      controller.uploadImage(
        { mimetype: 'image/webp', buffer: Buffer.from('image') },
        { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
      ),
    ).resolves.toEqual({
      image_url: '/api/clothing/images/12?asset=private-image',
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

  it('serves a Cloudinary image only for its authenticated owner', async () => {
    imageStorage.readCloudinary.mockResolvedValue({
      buffer: Buffer.from('image'),
      mimetype: 'image/webp',
    });

    await expect(
      controller.getCloudinaryImage(
        '12',
        'digital-wardrobe/users/12/123e4567-e89b-42d3-a456-426614174000',
        { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
      ),
    ).resolves.toBeDefined();
    await expect(
      controller.getCloudinaryImage(
        '13',
        'digital-wardrobe/users/13/123e4567-e89b-42d3-a456-426614174000',
        { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(imageStorage.readCloudinary).toHaveBeenCalledTimes(1);
  });

  it('cleans up owned image assets when an item is updated or deleted', async () => {
    const item = {
      clothing_id: 7,
      user_id: 12,
      image_url: '/api/clothing/images/12?asset=old-image',
    };
    clothingService.findOne.mockResolvedValue(item);
    clothingService.update.mockResolvedValue({
      ...item,
      image_url: '/api/clothing/images/12?asset=new-image',
    });
    clothingService.remove.mockResolvedValue(undefined);
    const owner = { sub: 12, email: 'user@example.com', sid: 'session', role: 'user' as const };

    await controller.update('7', { image_url: '/api/clothing/images/12?asset=new-image' }, owner);
    expect(imageStorage.delete).toHaveBeenCalledWith(item.image_url, 12);

    await controller.remove('7', owner);
    expect(imageStorage.delete).toHaveBeenLastCalledWith(item.image_url, 12);
  });
});
