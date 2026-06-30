import { createRouter, createWebHistory } from 'vue-router';
import routes from './staticRoute';

const BASE_URL: string = import.meta.env.VITE_BASE_URL || '';
const historyBaseUrl: string = `${BASE_URL}/apps/example`;

const router = createRouter({
  history: createWebHistory(historyBaseUrl),
  routes,
});

router.beforeEach((_to, _from, next) => {
  next();
});

export default router;
