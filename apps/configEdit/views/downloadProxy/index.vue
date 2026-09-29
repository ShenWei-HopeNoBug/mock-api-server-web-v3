<template>
  <a-card class="download-proxy" title="下载代理">
    <a-spin :spinning="loading">
      <div class="form-area">
        <a-alert
          v-if="!isReady"
          message="Qt 桥接尚未就绪"
          description="请稍候，页面将在桥接注册后自动加载配置。"
          type="warning"
          show-icon
        />
        <ProxyListInput v-else v-model:value="proxyList" />
      </div>
    </a-spin>
    <div class="footer">
      <a-button
        type="primary"
        :disabled="!isReady || loading"
        :loading="submitting"
        @click="onSubmit"
      >
        确定
      </a-button>
    </div>
  </a-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { useDownloadProxyApi } from '@apps/configEdit/views/downloadProxy/hooks/useDownloadProxyApi';
import ProxyListInput from '@apps/configEdit/views/downloadProxy/components/ProxyListInput/index.vue';
import { isDownloadProxyListValid, processDownloadProxyList } from './tools';

const proxyList = ref<DownloadProxyType.ProxyConfig[]>([]);
const loading = ref<boolean>(false);
const submitting = ref<boolean>(false);

const loadProxyList = async (): Promise<void> => {
  loading.value = true;
  try {
    const result = await getDownloadProxyList();
    proxyList.value = Array.isArray(result?.list) ? result.list : [];
  } catch {
    proxyList.value = [];
  } finally {
    loading.value = false;
  }
};

const { isReady, getDownloadProxyList, updateDownloadProxyList, closeDialog } = useDownloadProxyApi(
  {
    onReady: () => {
      void Promise.resolve().then(loadProxyList);
    },
  },
);

const onSubmit = async (): Promise<void> => {
  if (!isDownloadProxyListValid(proxyList.value)) {
    message.error('存在非法输入或未填写项，请检查');
    return;
  }

  submitting.value = true;
  try {
    await updateDownloadProxyList({
      download_proxy_list: processDownloadProxyList(proxyList.value),
    });
  } catch {
    return;
  } finally {
    submitting.value = false;
  }
  closeDialog();
};
</script>

<style scoped lang="scss">
.download-proxy {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.ant-card-body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.ant-spin-nested-loading) {
    flex: 1;
    min-height: 0;
  }

  :deep(.ant-spin-container) {
    height: 100%;
  }
}

.form-area {
  height: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden auto;
  padding-right: 14px;
  scrollbar-gutter: stable;
}

.footer {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  margin-top: 24px;
}
</style>
