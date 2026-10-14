import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/user.entity';

describe('MariaDB wardrobe integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const email = `mariadb-${Date.now()}@example.test`;
  const password = 'mariadb-integration-password';
  let cookie: string;
  let user_id: number;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    dataSource = app.get<DataSource>('DATA_SOURCE');
  });

  afterAll(async () => {
    try {
      if (user_id) await dataSource.getRepository(User).delete(user_id);
    } finally {
      if (dataSource?.isInitialized) await dataSource.destroy();
      await app?.close();
    }
  });

  it('persists an account, authenticates a session, and performs owner-scoped clothing CRUD', async () => {
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Wardrobe-Request', '1')
      .send({ name: 'MariaDB Test', email, password })
      .expect(201);
    user_id = registered.body.user.user_id;
    expect(registered.body.user.email).toBe(email);
    const setCookie = registered.headers['set-cookie'] as string[];
    cookie = setCookie[0].split(';', 1)[0];

    const stored = await dataSource.getRepository(User).findOne({
      where: { user_id },
    });
    expect(stored?.password).not.toBe(password);
    expect(stored?.password).toMatch(/^\$2[aby]\$/);

    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', cookie)
      .expect(200)
      .expect(({ body }) => expect(body.user.user_id).toBe(user_id));

    const categories = await request(app.getHttpServer())
      .get('/category')
      .set('Cookie', cookie)
      .expect(200);
    const category = categories.body.find(
      (entry: { name: string; category_id: number }) => entry.name === 'Tops',
    );
    expect(category).toBeDefined();

    const created = await request(app.getHttpServer())
      .post('/clothing')
      .set('Cookie', cookie)
      .set('X-Wardrobe-Request', '1')
      .send({
        name: 'Integration test coat',
        category_id: category.category_id,
        user_id: user_id + 1,
      })
      .expect(201);
    expect(created.body.user_id).toBe(user_id);

    await request(app.getHttpServer())
      .get('/clothing')
      .set('Cookie', cookie)
      .expect(200)
      .expect(({ body }) =>
        expect(body.items.map((item: { clothing_id: number }) => item.clothing_id))
          .toContain(created.body.clothing_id),
      );

    await request(app.getHttpServer())
      .delete(`/clothing/${created.body.clothing_id}`)
      .set('Cookie', cookie)
      .set('X-Wardrobe-Request', '1')
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .set('X-Wardrobe-Request', '1')
      .expect(200);
    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', cookie)
      .expect(401);
  });
});
