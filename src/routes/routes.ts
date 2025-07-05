import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { HomePage } from '../pages/home-page/page';

const routes: RouteObject[] = [
  {
    id: 'root',
    path: '/',
    Component: HomePage,
  },
  {
    path: '*',
    Component: lazy(async () =>
      import('../pages/404/page').then(module => ({ default: module.NotFound }))
    ),
  },
];

export default routes;
