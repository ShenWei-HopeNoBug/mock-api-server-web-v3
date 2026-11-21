import type { RouteRecordRaw } from 'vue-router';

const staticRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    component: () => import('@apps/dataManager/layouts/BasicLayout/index.vue'),
    redirect: '/outputManager',
    children: [
      {
        path: '/outputManager',
        name: 'outputManager',
        component: () => import('@apps/dataManager/views/outputManager/index.vue'),
        meta: {
          title: '数据列表',
        },
      },
      {
        path: '/testGroupManager',
        name: 'testGroupManager',
        component: () => import('@apps/dataManager/views/testGroupManager/index.vue'),
        meta: {
          title: '测试组',
        },
      },
      {
        path: '/testGroupManager/detail/:id',
        name: 'testGroupDetail',
        component: () => import('@apps/dataManager/views/testGroupManager/detail/index.vue'),
        meta: {
          title: '测试组详情',
          hidden: true,
          activeMenu: 'testGroupManager',
        },
      },
    ],
  },
];

export default staticRoute;
