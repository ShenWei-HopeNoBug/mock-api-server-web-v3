<template>
  <a-collapse
    v-model:active-key="activeKey"
    class="mock-request-tester"
    expand-icon-position="right"
    :destroy-inactive-panel="false"
  >
    <a-collapse-panel key="main" :force-render="true" :header="title">
      <!-- 请求配置行 -->
      <div class="request-row">
        <div class="url-row">
          <a-input v-model:value="url" placeholder="请输入请求 URL" class="url-input" allow-clear />
          <a-button type="primary" :loading="loading" @click="onSend">发送</a-button>
        </div>
        <div class="config-row">
          <a-select v-model:value="method" class="method-select" :options="methodOptions" />
          <a-select
            v-if="method === 'POST'"
            v-model:value="contentType"
            class="content-type-select"
            :options="contentTypeOptions"
          />
        </div>
        <UploadModule
          v-if="method === 'POST' && contentType === 'multipart/form-data'"
          :drag="true"
          drag-tip="拖拽上传"
          :max-count="1"
          :disabled="!!file"
          class="file-upload"
          @upload="onFileUpload"
        >
          <div v-if="!file" class="upload-trigger">
            <PlusOutlined />
            <span>上传文件</span>
          </div>
          <div v-else class="upload-file-name">
            <span class="file-name-text">{{ fileName }}</span>
            <CloseOutlined class="file-remove-icon" @click.stop="onClearFile" />
          </div>
        </UploadModule>
      </div>

      <!-- 请求参数 & 响应结果 -->
      <div class="content-row">
        <div class="panel">
          <div class="panel-title">请求参数</div>
          <JsonInput
            ref="paramsInputRef"
            v-model:value="params"
            :code-editor-style="{ height: '300px' }"
          />
        </div>
        <div class="panel">
          <div class="panel-title">响应结果</div>
          <JsonInput v-model:value="response" readonly :code-editor-style="{ height: '300px' }" />
          <div class="response-meta">
            <div class="meta-row">
              <span v-if="meta.statusCode !== undefined" class="meta-item">
                状态:
                <strong>{{ meta.statusCode }}</strong>
              </span>
              <span v-if="meta.duration !== undefined" class="meta-item">
                耗时:
                <strong>{{ meta.duration }}ms</strong>
              </span>
            </div>
            <div v-if="meta.errorMsg" class="meta-row">
              <span class="meta-item error">
                {{ meta.errorMsg }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a-collapse-panel>
  </a-collapse>
</template>

<script lang="ts" setup name="MockRequestTester">
import { ref, reactive, watch, computed } from 'vue';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import UploadModule from '@/components/upload/UploadModule/index.vue';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import type { MockRequestTesterType } from './type';
import { isJsonString } from '@/utils';
import { methodOptions, contentTypeOptions } from './config';
import { buildRequestData } from './tools';
import { getFileNameInfo } from '@/components/upload/MultiUploadModule/tools';

const COLLAPSE_KEY = 'main';

interface Props {
  /** 测试模块配置 */
  option?: MockRequestTesterType.Option;
  /** 设备 ID */
  deviceId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  option: () => ({}),
  deviceId: '',
});

const url = ref<string>(props.option?.url ?? '');
const method = ref<MockRequestTesterType.Method>(props.option?.method ?? 'GET');
const contentType = ref<MockRequestTesterType.ContentType>(
  props.option?.contentType ?? 'application/json',
);
const params = ref<string>(props.option?.params ?? '{}');
const title = props.option?.title ?? '接口测试';
const activeKey = ref<string[]>(props.option?.defaultExpanded !== false ? [COLLAPSE_KEY] : []);
const response = ref<string>('{}');
const loading = ref<boolean>(false);
const paramsInputRef = ref<InstanceType<typeof JsonInput>>();
const file = ref<File | null>(null);

const fileName = computed((): string =>
  file.value instanceof File ? getFileNameInfo(file.value).name : '',
);

const meta = reactive<MockRequestTesterType.ResponseMeta>({});

const onSend = async () => {
  if (!url.value) {
    message.warning('请输入请求 URL');
    return;
  }

  if (!paramsInputRef.value?.validate()) {
    message.warning('请求参数不是合法的 JSON');
    return;
  }

  loading.value = true;
  meta.statusCode = undefined;
  meta.duration = undefined;
  meta.errorMsg = undefined;
  response.value = '{}';

  const startTime = performance.now();

  try {
    const parsed = JSON.parse(params.value);
    const extraConfig: AxiosRequestConfig = buildRequestData({
      method: method.value,
      contentType: contentType.value,
      params: parsed,
      file: file.value,
      deviceId: props.deviceId,
    });

    const res = await axios.request({
      url: url.value,
      method: method.value,
      ...extraConfig,
    });

    console.groupCollapsed(
      `%c[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 请求成功 ${url.value}`,
      'color: #52c41a; font-weight: bold;',
    );
    console.log('状态码:', res.status);
    console.log('耗时:', `${Math.round(performance.now() - startTime)}ms`);
    console.log('响应数据:', res.data);
    console.groupEnd();
    const endTime = performance.now();
    meta.statusCode = res.status;
    meta.duration = Math.round(endTime - startTime);
    response.value = JSON.stringify(res.data, null, 2);
  } catch (error: any) {
    console.groupCollapsed(
      `%c[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 请求失败 ${url.value}`,
      'color: #ff4d4f; font-weight: bold;',
    );
    console.log('错误信息:', error?.message || '请求失败');
    console.log('耗时:', `${Math.round(performance.now() - startTime)}ms`);
    if (error?.response) {
      console.log('状态码:', error.response.status);
      console.log('响应数据:', error.response.data);
    }
    console.log('完整错误:', error);
    console.groupEnd();
    const endTime = performance.now();
    meta.duration = Math.round(endTime - startTime);

    if (error?.response) {
      meta.statusCode = error.response.status;
      meta.errorMsg = error.message;
      response.value = isJsonString(error.response.data)
        ? JSON.stringify(error.response.data, null, 2)
        : '{}';
    } else {
      meta.errorMsg = error?.message || '请求失败';
      response.value = isJsonString(error?.message)
        ? JSON.stringify(error?.message, null, 2)
        : '{}';
    }
  } finally {
    loading.value = false;
  }
};

const onFileUpload = (files: File[]) => {
  file.value = files[0] ?? null;
};

const onClearFile = () => {
  file.value = null;
};

watch([method, contentType], () => {
  file.value = null;
});

const expand = () => {
  activeKey.value = [COLLAPSE_KEY];
};

const collapse = () => {
  activeKey.value = [];
};

defineExpose({
  send: onSend,
  expand,
  collapse,
});
</script>

<style scoped lang="scss">
.mock-request-tester {
  margin-bottom: 16px;

  :deep(.ant-collapse-header) {
    font-weight: 500;
    background: #fff;
  }

  :deep(.ant-collapse-content-box) {
    padding: 24px;
  }

  .request-row {
    margin-bottom: 16px;

    .url-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .url-input {
        flex: 1;
      }
    }

    .config-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .method-select {
      width: 100px;
    }

    .content-type-select {
      width: 240px;
    }

    .file-upload {
      margin-top: 8px;

      .upload-trigger {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100px;
        height: 100px;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        background: #fafafa;
        color: #999;
        cursor: pointer;
        transition: border-color 0.2s;
        font-size: 13px;

        &:hover {
          border-color: #1890ff;
          color: #1890ff;
        }
      }

      .upload-file-name {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        max-width: 100%;
        padding: 6px 8px;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        background: #fafafa;
        color: #333;
        font-size: 13px;
        word-break: break-all;

        .file-name-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-remove-icon {
          flex-shrink: 0;
          color: #999;
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: #ff4d4f;
          }
        }
      }
    }
  }

  .content-row {
    display: flex;
    gap: 16px;

    .panel {
      flex: 1;
      min-width: 0;

      .panel-title {
        font-weight: 600;
        margin-bottom: 8px;
      }

      .response-meta {
        margin-top: 8px;
        min-height: 42px;

        .meta-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .meta-item {
          font-size: 13px;

          &.error {
            color: #ff4d4f;
          }
        }
      }
    }
  }
}
</style>
