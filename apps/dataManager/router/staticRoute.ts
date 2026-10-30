import type { RouteRecordRaw } from 'vue-router';

const staticRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/outputManager',
    children: [
      {
        path: '/outputManager',
        name: 'outputManager',
        component: () => import('@apps/dataManager/views/outputManager/index.vue'),
        meta: {
          title: 'outputManager',
        },
      },
    ],
  },
];

export default staticRoute;
