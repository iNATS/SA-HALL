import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns API metadata without exposing configuration', () => {
      expect(appController.getInfo()).toEqual({
        name: 'sa-hall-api',
        version: 'v1',
        status: 'migration-foundation',
      });
    });
  });
});
