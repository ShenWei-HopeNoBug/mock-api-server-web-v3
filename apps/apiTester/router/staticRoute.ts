import type { RouteRecordRaw } from 'vue-router';

const staticRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/mockTester',
    children: [
      {
        path: '/mockTester',
        name: 'mockTester',
        component: () => import('@apps/apiTester/views/mockTester/index.vue'),
        meta: {
          title: 'mockTester',
        },
      },
      {
        path: '/staticResourceTester',
        name: 'staticResourceTester',
        component: () => import('@apps/apiTester/views/staticResourceTester/index.vue'),
        meta: {
          title: 'staticResourceTester',
        },
      },
    ],
  },
];

export default staticRoute;
