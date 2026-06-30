import { RouteRecordRaw } from 'vue-router';

const staticRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/hello',
    children: [
      {
        path: '/hello',
        name: 'hello',
        component: () => import('@apps/example/views/Hello.vue'),
        meta: {
          title: 'hello',
        },
      },
    ],
  },
];

export default staticRoute;
