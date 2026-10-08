<template>
  <a-card class="download-proxy" title="下载代理">
    <Spin :spinning="loading || !isReady" class="spin-wrap">
      <div class="form-area">
        <ProxyListInput v-model:value="proxyList" />
      </div>
    </Spin>
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
import { nextTick, ref } from 'vue';
import { message } from 'ant-design-vue';
import { generateUUID } from '@/utils';
import Spin from '@/components/Spin/index.vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { useDownloadProxyApi } from '@apps/configEdit/views/downloadProxy/hooks/useDownloadProxyApi';
import ProxyListInput from '@apps/configEdit/views/downloadProxy/components/ProxyListInput/index.vue';
import { isDownloadProxyListValid, processDownloadProxyList } from './tools';

// 下载代理配置列表
const proxyList = ref<DownloadProxyType.ProxyConfig[]>([]);
// 列表加载中状态
const loading = ref<boolean>(false);
// 提交中状态
const submitting = ref<boolean>(false);
// 加载令牌：标记最新一次请求，防止旧响应覆盖新数据
let loadToken = '';

/** 拉取下载代理列表 */
const loadProxyList = (): void => {
  // 每次请求生成新令牌，竞态时仅保留最新请求的结果
  const token = generateUUID();
  loadToken = token;
  loading.value = true;
  getDownloadProxyList()
    .then(result => {
      // 令牌已失效（期间发起了新请求），丢弃本次过期响应
      if (loadToken !== token) {
        return;
      }
      proxyList.value = Array.isArray(result?.list) ? result.list : [];
    })
    .finally(() => {
      if (loadToken === token) {
        loading.value = false;
      }
    });
};

// 桥接接口：QT 侧就绪后于下一帧加载列表，确保通信通道可用
const { isReady, getDownloadProxyList, updateDownloadProxyList, closeDialog } = useDownloadProxyApi(
  {
    onReady: () => {
      nextTick(() => {
        loadProxyList();
      });
    },
  },
);

/** 校验并提交下载代理配置，成功后关闭弹窗 */
const onSubmit = (): void => {
  // 存在非法输入或未填写项时阻止提交
  if (!isDownloadProxyListValid(proxyList.value)) {
    message.error('存在非法输入或未填写项，请检查');
    return;
  }

  submitting.value = true;
  updateDownloadProxyList({
    // 提交前对列表做清洗/格式化处理
    download_proxy_list: processDownloadProxyList(proxyList.value),
  })
    .then(() => {
      closeDialog();
    })
    .finally(() => {
      submitting.value = false;
    });
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

  // 让 Spin 根节点撑满卡片主体的剩余高度
  .spin-wrap {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
}

.form-area {
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 14px;
}

.footer {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  margin-top: 24px;
}
</style>
