<template>
  <div class="app">
    <a-config-provider :locale="zhCN">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
</script>

<style scoped lang="scss">
.app {
  width: 100%;
  height: 100%;
  padding: 20px;
}
</style>
