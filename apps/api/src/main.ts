import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/http/api-exception.filter.js';
import { JsonLogger } from './common/logging/json.logger.js';

async function bootstrap() {
  const logger = new JsonLogger();
  const adapter = new FastifyAdapter({
    bodyLimit: 1_048_576,
    genReqId: (request: IncomingMessage) => {
      const candidate = request.headers['x-request-id'];
      return typeof candidate === 'string' &&
        /^[a-zA-Z0-9._:-]{8,128}$/.test(candidate)
        ? candidate
        : randomUUID();
    },
    logger: false,
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { logger },
  );
  const config = app.get(ConfigService);
  const origins = config.getOrThrow<string>('CORS_ORIGINS').split(',');
  const server = app.getHttpAdapter().getInstance();
  const startedAt = new WeakMap<object, bigint>();

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  app.enableCors({
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: origins,
  });
  server.addHook('onRequest', async (request, reply) => {
    startedAt.set(request, process.hrtime.bigint());
    void reply.header('x-request-id', request.id);
  });
  server.addHook('onResponse', async (request, reply) => {
    const started = startedAt.get(request) ?? process.hrtime.bigint();
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    logger.log({
      event: 'http_request',
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      statusCode: reply.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: false,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(logger));
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  logger.log({ event: 'application_started', port });
}
await bootstrap();
