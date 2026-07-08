import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './staticRoute';

const BASE_URL: string = import.meta.env.VITE_BASE_URL || '';
const historyBaseUrl: string = `${BASE_URL}/apps/dataManager`;

const router = createRouter({
  history: createWebHashHistory(historyBaseUrl),
  routes,
});

router.beforeEach((_to, _from, next) => {
  next();
});

export default router;
