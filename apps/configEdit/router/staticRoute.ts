import type { RouteRecordRaw } from 'vue-router';

const staticRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/downloadProxy',
    children: [
      {
        path: '/downloadProxy',
        name: 'downloadProxy',
        component: () => import('@apps/configEdit/views/downloadProxy/index.vue'),
        meta: {
          title: 'downloadProxy',
        },
      },
    ],
  },
];

export default staticRoute;
