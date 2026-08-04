<template>
  <a-modal
    v-model:visible="visible"
    title="抓包接口数据详情"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    centered
    destroy-on-close
    wrap-class-name="output-manager-detail-dialog"
    @cancel="close"
  >
    <Spin :loading="loading" class="scroll">
      <div class="content" v-jump-forbid>
        <InfoDescription :columns="infoColumns" :info-item-style="infoItemStyle" align="left">
          <template #value="scoped">
            <div
              v-if="scoped.rowKey === 'params' || scoped.rowKey === 'response'"
              class="json-area"
            >
              <JsonInput
                :value="scoped.value"
                :readonly="scoped.options?.extra?.readonly"
                :code-editor-style="scoped.options?.extra?.codeEditorStyle"
                default-copy-content="{}"
              />
            </div>
          </template>
        </InfoDescription>
      </div>
    </Spin>
  </a-modal>
</template>

<script lang="ts" setup name="DetailDialog">
import { computed, CSSProperties, ref } from 'vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import InfoDescription from '@/components/InfoDescription/index.vue';
import Spin from '@/components/Spin/index.vue';
import type { DetailDialogType } from './type';
import type { InfoDescriptionType } from '@/components/InfoDescription/type';
import { useOutputManagerApi } from '../../hooks/useOutputManagerApi';
import { generateUUID } from '@/utils';
import { message } from 'ant-design-vue';

const infoItemStyle: CSSProperties = {
  marginBottom: '24px',
};

const { getMockDataDetail } = useOutputManagerApi();

const emits = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref<boolean>(false);
const loading = ref<boolean>(false);
const detailData = ref<DetailDialogType.DataSource>({});
const currentRequestToken = ref<string>(generateUUID());

const infoColumns = computed((): InfoDescriptionType.InfoOptions[] => {
  const {
    id = '',
    url = '',
    method = '',
    request_content_type = '',
    timeout,
    params,
    response,
  } = detailData.value;

  return [
    {
      rowKey: 'id',
      value: id,
      label: 'ID',
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'url',
      value: url,
      label: '请求Url',
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'method',
      label: '请求类型',
      value: method,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'request_content_type',
      label: 'Content-Type',
      value: request_content_type,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'timeout',
      label: '响应延时(ms)',
      value: timeout,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'params',
      label: '请求参数',
      value: params,
      slot: true,
      tooltip: false,
      ellipsis: false,
      extra: {
        readonly: true,
        codeEditorStyle: {
          height: '300px',
        },
      },
    },
    {
      rowKey: 'response',
      label: '响应数据',
      value: response,
      slot: true,
      tooltip: false,
      ellipsis: false,
      extra: {
        readonly: true,
        codeEditorStyle: {
          height: '550px',
        },
      },
    },
  ];
});

const resetStates = () => {
  detailData.value = {};
  currentRequestToken.value = generateUUID();
  loading.value = false;
};

const getDetailData = (id: string = '') => {
  loading.value = true;
  const token = generateUUID();
  currentRequestToken.value = token;

  getMockDataDetail({ id })
    .then(res => {
      if (currentRequestToken.value !== token) {
        return;
      }
      detailData.value = res || {};
    })
    .catch(() => {
      if (currentRequestToken.value !== token) {
        return;
      }
      message.error('获取抓包接口数据详情失败');
      detailData.value = {};
    })
    .finally(() => {
      if (currentRequestToken.value === token) {
        loading.value = false;
      }
    });
};

const show = async (id: string = ''): Promise<void> => {
  visible.value = true;
  resetStates();
  getDetailData(id);
};

const close = (): void => {
  visible.value = false;
  resetStates();
  emits('close');
};

defineExpose({
  show,
  close,
});
</script>

<style scoped lang="scss">
.scroll {
  width: 100%;
  height: calc(100vh - 160px);
  overflow: hidden;
  overflow-y: auto;
}

.content {
  width: 100%;
  padding-right: 8px;
  scrollbar-gutter: stable;
  word-break: break-word;
}

.json-area {
  padding: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
