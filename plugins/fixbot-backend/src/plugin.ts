import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * fixbotPlugin backend plugin
 *
 * @public
 */
export const fixbotPlugin = createBackendPlugin({
  pluginId: 'fixbot',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ httpRouter, logger, config }) {
        httpRouter.use(
          await createRouter({
            logger,
            config,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/chat',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/fix-code',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/analyze',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/explain',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
