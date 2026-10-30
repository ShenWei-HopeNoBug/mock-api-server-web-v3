<template>
  <Spin :spinning="loadingRef" class="app" tip="Qt 桥接资源加载中...">
    <a-config-provider :locale="zhCN">
      <router-view />
    </a-config-provider>
  </Spin>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import Spin from '@/components/Spin/index.vue';
import QtBridge from '@/utils/bridge/QtBridge';
import { message } from 'ant-design-vue';
import { useQtBridgeStore } from '@apps/configEdit/store/useQtBridge';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

const qtBridgeStore = useQtBridgeStore();

const loadingRef = ref<boolean>(false);

const init = () => {
  loadingRef.value = true;
  QtBridge.getQtBridgeData()
    .then(result => {
      const { error, message: msg = '', channelObj = null } = result;
      if (error) {
        if (msg) {
          message.error(msg);
        }
      }

      qtBridgeStore.setRegister(!error);
      qtBridgeStore.setChannelObj(channelObj);
    })
    .finally(() => {
      loadingRef.value = false;
    });
};

onBeforeMount(() => {
  init();
});
</script>

<style scoped lang="scss">
.app {
  width: 100%;
  height: 100%;
  padding: 20px;
}
</style>
