import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const fixbotPlugin = createPlugin({
  id: 'fixbot',
  routes: {
    root: rootRouteRef,
  },
});

export const FixbotPage = fixbotPlugin.provide(
  createRoutableExtension({
    name: 'FixbotPage',
    component: () =>
      import('./components/ChatInterface').then(m => m.ChatInterface),
    mountPoint: rootRouteRef,
  }),
);
