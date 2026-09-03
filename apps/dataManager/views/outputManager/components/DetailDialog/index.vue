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
    <Spin class="container" :spinning="loading">
      <div class="scroll">
        <div class="content" v-jump-forbid>
          <InfoDescription :columns="infoColumns" :info-item-style="infoItemStyle" align="left">
            <template #value="scoped">
              <div v-if="scoped.rowKey === 'url'" class="url-cell">
                <template v-if="scoped.value">
                  <span class="url-text">{{ scoped.value }}</span>
                  <CopyIcon :text="scoped.value" :tooltip="true" />
                </template>
                <template v-else>-</template>
              </div>
              <div
                v-else-if="scoped.rowKey === 'params' || scoped.rowKey === 'response'"
                class="json-area"
              >
                <JsonInput
                  :value="scoped.value"
                  :readonly="true"
                  :code-editor-style="scoped.options?.extra?.codeEditorStyle"
                  default-copy-content="{}"
                />
              </div>
              <div v-else-if="scoped.rowKey === 'response_variants'" class="variant-list">
                <template v-if="isArrayValid(scoped.value)">
                  <div
                    v-for="(variant, vIndex) in scoped.value || []"
                    :key="`variant-${variant.id}-${vIndex}`"
                    class="variant-item"
                  >
                    <div class="variant-index">{{ `#${vIndex + 1}` }}</div>
                    <InfoDescription
                      :columns="getVariantColumns(variant)"
                      :info-item-style="variantItemStyle"
                      align="left"
                    >
                      <template #value="vScoped">
                        <div v-if="vScoped.rowKey === 'response'" class="json-area">
                          <JsonInput
                            :value="vScoped.value"
                            :readonly="true"
                            :code-editor-style="vScoped.options?.extra?.codeEditorStyle"
                            default-copy-content="{}"
                          />
                        </div>
                      </template>
                    </InfoDescription>
                  </div>
                </template>
                <div v-else class="variant-empty">
                  <a-empty />
                </div>
              </div>
            </template>
          </InfoDescription>
        </div>
      </div>
    </Spin>
  </a-modal>
</template>

<script lang="ts" setup name="DetailDialog">
import { computed, CSSProperties, ref } from 'vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import InfoDescription from '@/components/InfoDescription/index.vue';
import Spin from '@/components/Spin/index.vue';
import CopyIcon from '@/components/CopyIcon/index.vue';
import type { DetailDialogType } from './type';
import type { InfoDescriptionType } from '@/components/InfoDescription/type';
import type { DataManagerType } from '#/qt/dataManager';
import { useOutputManagerApi } from '../../hooks/useOutputManagerApi';
import { generateUUID, isArrayValid } from '@/utils';

const infoItemStyle: CSSProperties = {
  marginBottom: '24px',
};

const variantItemStyle: CSSProperties = {
  marginBottom: '8px',
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
    response_variants = [],
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
      slot: true,
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
    {
      rowKey: 'response_variants',
      label: '响应变体',
      value: Array.isArray(response_variants) ? response_variants : [],
      slot: true,
      tooltip: false,
      ellipsis: false,
    },
  ];
});

const getVariantColumns = (
  variant: DataManagerType.ApiResponseVariant,
): InfoDescriptionType.InfoOptions[] => {
  return [
    {
      rowKey: 'id',
      label: '变体ID',
      value: variant.id,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'api_data_id',
      label: 'API数据ID',
      value: variant.api_data_id,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'name',
      label: '变体名称',
      value: variant.name,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'enabled',
      label: '是否启用',
      value: variant.enabled ? '是' : '否',
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'timeout',
      label: '响应延时(ms)',
      value: variant.timeout,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'operator',
      label: '操作人',
      value: variant.operator,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'type',
      label: '来源类型',
      value: variant.type,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'response',
      label: '响应数据',
      value: variant.response,
      slot: true,
      tooltip: false,
      ellipsis: false,
      extra: {
        codeEditorStyle: {
          height: '300px',
        },
      },
    },
    {
      rowKey: 'created_at',
      label: '创建时间',
      value: variant.created_at,
      tooltip: false,
      ellipsis: false,
    },
    {
      rowKey: 'updated_at',
      label: '更新时间',
      value: variant.updated_at,
      tooltip: false,
      ellipsis: false,
    },
  ];
};

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
.container {
  width: 100%;
  height: calc(100vh - 160px);
  overflow: hidden;

  .scroll {
    width: 100%;
    height: 100%;
    overflow: hidden;
    overflow-y: auto;

    .content {
      width: 100%;
      padding-right: 8px;
      scrollbar-gutter: stable;
      word-break: break-word;

      .url-cell {
        display: flex;
        align-items: center;

        .url-text {
          word-break: break-all;
          margin-right: 6px;
        }
      }
    }

    .json-area {
      padding: 14px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .variant-list {
      padding: 14px;
      border-radius: 4px;
      border: 1px solid #ccc;

      .variant-item {
        width: 100%;

        .variant-index {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 8px;
        }

        &:not(:last-child) {
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e8e8e8;
        }
      }

      .variant-empty {
        width: 100%;
        padding: 40px 0;
      }
    }
  }
}
</style>
