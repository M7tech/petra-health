import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security headers. In production, TLS termination (HTTPS) is enforced at the
  // reverse proxy / load balancer; HSTS below signals HTTPS-only to clients.
  app.use(
    helmet({
      hsts: { maxAge: 15552000, includeSubDomains: true },
    }),
  );

  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.setGlobalPrefix('api');

  // Render (and most PaaS) inject PORT; fall back to API_PORT for local dev.
  const port = Number(config.get('PORT') ?? config.get('API_PORT') ?? 3001);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Petra Health API listening on port ${port} (prefix /api)`);
}
bootstrap();
