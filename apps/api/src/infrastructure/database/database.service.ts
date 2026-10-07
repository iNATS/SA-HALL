import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({
      host: config.getOrThrow<string>('DATABASE_HOST'),
      port: config.getOrThrow<number>('DATABASE_PORT'),
      database: config.getOrThrow<string>('DATABASE_NAME'),
      user: config.getOrThrow<string>('DATABASE_USER'),
      password: config.getOrThrow<string>('DATABASE_PASSWORD'),
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 30_000,
      max: config.getOrThrow<number>('DATABASE_POOL_MAX'),
      ssl:
        config.getOrThrow<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: true }
          : false,
    });
  }

  async query<Row extends QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ) {
    return this.pool.query<Row>(text, values);
  }

  async ping(): Promise<void> {
    await this.pool.query('select 1');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
