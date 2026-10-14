import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const trustProxyHops = process.env.TRUST_PROXY_HOPS;
  if (trustProxyHops !== undefined && trustProxyHops !== '') {
    const parsedHops = Number(trustProxyHops);
    if (
      !/^(0|[1-9]\d*)$/.test(trustProxyHops) ||
      !Number.isSafeInteger(parsedHops)
    ) {
      throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
    }
    app.set('trust proxy', parsedHops);
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();