import { ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports liveness without querying dependencies', () => {
    const database = { ping: vi.fn() } as unknown as DatabaseService;
    const service = new HealthService(database);

    expect(service.liveness()).toEqual({ status: 'ok' });
    expect(database.ping).not.toHaveBeenCalled();
  });

  it('reports readiness after PostgreSQL responds', async () => {
    const database = {
      ping: vi.fn().mockResolvedValue(undefined),
    } as unknown as DatabaseService;
    const service = new HealthService(database);

    await expect(service.readiness()).resolves.toEqual({
      status: 'ready',
      checks: { database: 'up' },
    });
  });

  it('returns a safe error when PostgreSQL is unavailable', async () => {
    const database = {
      ping: vi.fn().mockRejectedValue(new Error('secret connection detail')),
    } as unknown as DatabaseService;
    const service = new HealthService(database);

    await expect(service.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
