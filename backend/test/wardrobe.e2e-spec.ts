import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ClothingController } from '../src/clothing/clothing.controller';
import { ClothingService } from '../src/clothing/clothing.service';
import { ImageStorageService } from '../src/clothing/image-storage.service';
import { CsrfGuard } from '../src/auth/csrf.guard';
import { OutfitController } from '../src/outfit/outfit.controller';
import { OutfitService } from '../src/outfit/outfit.service';

class TestUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      sub: 12,
      email: 'test@example.com',
      sid: 'test-session',
      role: 'user',
    };
    return true;
  }
}

describe('Wardrobe API (HTTP integration)', () => {
  let app: INestApplication;
  const clothingRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const outfitRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClothingController, OutfitController],
      providers: [
        ClothingService,
        OutfitService,
        { provide: 'CLOTHING_REPOSITORY', useValue: clothingRepository },
        { provide: 'OUTFIT_REPOSITORY', useValue: outfitRepository },
        { provide: ImageStorageService, useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalGuards(new TestUserGuard(), new CsrfGuard());
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks state-changing requests without the CSRF header', async () => {
    await request(app.getHttpServer())
      .post('/clothing')
      .send({ name: 'Coat', category_id: 3 })
      .expect(403);

    expect(clothingRepository.save).not.toHaveBeenCalled();
  });

  it('validates request bodies and applies the authenticated owner', async () => {
    await request(app.getHttpServer())
      .post('/clothing')
      .set('X-Wardrobe-Request', '1')
      .send({ name: '', category_id: 3 })
      .expect(400);
    expect(clothingRepository.save).not.toHaveBeenCalled();

    clothingRepository.save.mockImplementation(async (data) => ({
      clothing_id: 4,
      ...data,
    }));
    const response = await request(app.getHttpServer())
      .post('/clothing')
      .set('X-Wardrobe-Request', '1')
      .send({
        name: ' Coat ',
        category_id: 3,
        user_id: 999,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      clothing_id: 4,
      name: 'Coat',
      category_id: 3,
      user_id: 12,
    });
  });

  it('rejects malformed outfit data with a client error', async () => {
    await request(app.getHttpServer())
      .post('/outfit')
      .set('X-Wardrobe-Request', '1')
      .send({ name: ' ' })
      .expect(400);

    expect(outfitRepository.save).not.toHaveBeenCalled();
  });
});
