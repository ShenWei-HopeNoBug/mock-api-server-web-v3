<template>
  <UploadModule
    :accept-list="acceptList"
    :auto-upload="autoUpload"
    :disabled="disabled"
    :drag="true"
    :drag-tip="dragTip"
    :max-count="maxCount"
    :size-limit="sizeLimit"
    @upload="onUpload"
  >
    <slot :uploading="uploading" name="content" />
  </UploadModule>
</template>

<script lang="ts" setup name="MultiUploadModule">
import { onBeforeUnmount, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { cloneDeep } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import UploadModule from '@/components/upload/UploadModule/index.vue';
import type { MultiUploadModuleType } from './type';
import {
  abortAllUploadRequest,
  getUploadPromiseData,
  getUploadStatusUpdateMap,
  insertUploadFileList,
  linkExePromiseFnList,
  splitFileDataList,
  updateFileData,
} from './tools';
import i18n from '@/locales';

const { t } = useI18n();

interface Props {
  disabled?: boolean;
  autoUpload?: boolean;
  dragTip?: string;
  maxCount?: number;
  acceptList?: string[];
  sizeLimit?: number;
  beforeUpload?: MultiUploadModuleType.BeforeUpload;
  afterUpload?: MultiUploadModuleType.AfterUpload;
  uploadApi?: MultiUploadModuleType.UploadApi;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  autoUpload: true,
  dragTip: i18n.global.t('global.multiUploadModule.dropTip'),
  maxCount: 1,
  acceptList: () => [],
  sizeLimit: 0,
});

const emits = defineEmits<{
  (e: 'upload', list: MultiUploadModuleType.UploadFileData[]): void;
  (e: 'uploadStatusChange', uploading: boolean): void;
}>();

const uploading = ref(false);
const fileColumns = ref<MultiUploadModuleType.UploadFileData[]>([]);
const destroyed = ref(false);

// 处理选择文件后的上传入口
const onUpload = (fileList: File[] = []) => {
  // 空文件或正在上传时直接退出
  if (!fileList.length || uploading.value) {
    return;
  }

  // 初始化上传队列数据
  let insertList = insertUploadFileList(fileList, []);

  const callback = () => {
    // 无需上传时还原状态
    if (!Array.isArray(insertList) || !insertList.length) {
      uploading.value = false;
      return;
    }

    // 合并文件列表并开始上传
    fileColumns.value = [...fileColumns.value, ...insertList];
    startUpload();
  };

  if (typeof props.beforeUpload === 'function') {
    const result = props.beforeUpload(insertList);
    if (result instanceof Promise) {
      // beforeUpload 异步校验
      uploading.value = true;
      result
        .then(list => {
          insertList = list;
          callback();
        })
        .catch(() => {
          uploading.value = false;
        });
    } else {
      // beforeUpload 同步处理
      insertList = result;
      callback();
    }
  } else {
    callback();
  }
};

// 生成分片上传的 promise 执行列表
const getPromiseFnList = () => {
  // 根据配置拆分上传文件
  const splitUploadList = splitFileDataList(fileColumns.value);
  return splitUploadList.map(
    splitList => (): Promise<void> =>
      new Promise(resolve => {
        // 生成上传 promise 并更新初始状态
        const { promiseList, updateDataMap } = getUploadPromiseData({
          splitList,
          uploadApi: props.uploadApi,
        });

        // 写入上传中的状态
        fileColumns.value = updateFileData({
          updateMap: updateDataMap,
          fileDataList: fileColumns.value,
        });

        Promise.allSettled(promiseList)
          .then(arr => {
            // 根据上传结果更新成功/失败状态
            const updateMap = getUploadStatusUpdateMap(arr, splitList);
            fileColumns.value = updateFileData({
              updateMap,
              fileDataList: fileColumns.value,
            });
          })
          .finally(() => {
            resolve();
          });
      }),
  );
};

// 串行执行上传任务并触发回调
const startUpload = () => {
  const promiseFnList = getPromiseFnList();
  uploading.value = true;
  // 按顺序执行上传队列
  linkExePromiseFnList(promiseFnList, () => {
    if (destroyed.value) {
      return;
    }

    let emitList: MultiUploadModuleType.UploadFileData[] = [];
    let errorCount = 0;
    // 统计成功/失败的上传结果
    fileColumns.value.forEach(item => {
      const { uploadStatus } = item;
      if (uploadStatus === 'SUCCESS') {
        emitList.push(item);
      } else if (uploadStatus === 'FAILURE') {
        errorCount += 1;
      }
    });

    // 失败数量提示
    if (errorCount > 0) {
      message.error(t('global.multiUploadModule.uploadFailedCount', { count: errorCount }));
    }

    // 清空当前上传队列
    fileColumns.value = [];

    const callback = () => {
      // 收尾并抛出成功列表
      uploading.value = false;
      emits('upload', cloneDeep(emitList));
    };

    if (typeof props.afterUpload === 'function') {
      const result = props.afterUpload(emitList);
      if (result instanceof Promise) {
        // afterUpload 异步处理
        result
          .then(list => {
            emitList = list;
            callback();
          })
          .catch(() => {
            uploading.value = false;
          });
      } else {
        // afterUpload 同步处理
        emitList = result;
        callback();
      }
    } else {
      callback();
    }
  });
};

onBeforeUnmount(() => {
  // 组件卸载时中断未完成的上传
  destroyed.value = true;
  abortAllUploadRequest(fileColumns.value);
});

watch(
  uploading,
  bool => {
    emits('uploadStatusChange', bool);
  },
  { immediate: true },
);
</script>
