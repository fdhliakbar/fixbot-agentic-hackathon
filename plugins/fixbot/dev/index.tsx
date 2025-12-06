import { createDevApp } from '@backstage/dev-utils';
import { fixbotPlugin, FixbotPage } from '../src/plugin';

createDevApp()
  .registerPlugin(fixbotPlugin)
  .addPage({
    element: <FixbotPage />,
    title: 'Root Page',
    path: '/fixbot',
  })
  .render();
