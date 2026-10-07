import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'sa-hall-api',
      version: 'v1',
      status: 'migration-foundation',
    } as const;
  }
}
