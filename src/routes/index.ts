// eslint-disable-next-line check-file/no-index
import { createBrowserRouter } from 'react-router-dom';

import routes from './routes';

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });

export default router;
