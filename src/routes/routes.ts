import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { VacationPlannerPage } from '../pages/vacation-planner/page';

const routes: RouteObject[] = [
  {
    id: 'root',
    path: '/',
    Component: VacationPlannerPage,
  },
  {
    path: '*',
    Component: lazy(async () =>
      import('../pages/404/page').then(module => ({ default: module.NotFound }))
    ),
  },
];

export default routes;
