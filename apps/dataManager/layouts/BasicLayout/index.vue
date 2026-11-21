<template>
  <div class="basic-layout">
    <div class="nav-bar">
      <a-menu v-model:selected-keys="selectedKeys" mode="horizontal" class="nav-menu">
        <a-menu-item v-for="item in menuItems" :key="item.name">
          {{ item.title }}
        </a-menu-item>
      </a-menu>
    </div>
    <div class="page-body">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup name="BasicLayout">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import staticRoute from '@apps/dataManager/router/staticRoute';

interface MenuItem {
  name: string;
  title: string;
}

const route = useRoute();
const router = useRouter();

// 菜单项由 root 路由 children 生成：meta.title 为显示文案，meta.hidden 项不进菜单
const menuItems = computed<MenuItem[]>(() => {
  const root = staticRoute.find(item => item.name === 'root');
  return (root?.children ?? [])
    .filter(child => !child.meta?.hidden)
    .map(child => ({
      name: String(child.name),
      title: String(child.meta?.title ?? child.name),
    }));
});

// 隐藏页（如组详情）经 meta.activeMenu 回挂到父菜单项高亮
const selectedKeys = computed<string[]>({
  get: () => [String(route.meta?.activeMenu ?? route.name)],
  set: keys => {
    const target = keys[0];
    if (target && target !== route.name) {
      router.push({ name: target });
    }
  },
});
</script>

<style scoped lang="scss">
.basic-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .nav-bar {
    flex-shrink: 0;
    margin-bottom: 16px;
    border-bottom: 1px solid $qt-border-soft;

    .nav-menu {
      background: transparent;
      border-bottom: none;
    }
  }

  .page-body {
    flex: 1;
    overflow: hidden;
  }
}
</style>
