import {
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

describe('createRouter', () => {
  let app: express.Express;

  beforeEach(async () => {
    const router = await createRouter({
      logger: mockServices.logger.mock(),
      config: mockServices.rootConfig({
        data: {
          fixbot: {
            claude: {
              apiKey: 'test-key',
              model: 'claude-test',
            },
          },
        },
      }),
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('model');
  });
});
