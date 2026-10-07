import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  liveness() {
    return { status: 'ok' } as const;
  }

  async readiness() {
    try {
      await this.database.ping();
      return { status: 'ready', checks: { database: 'up' } } as const;
    } catch {
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'الخدمة غير جاهزة بعد. حاول مرة أخرى لاحقاً.',
      });
    }
  }
}
