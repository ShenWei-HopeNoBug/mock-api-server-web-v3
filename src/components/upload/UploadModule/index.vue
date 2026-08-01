<template>
  <DragUploadModule
    :disabled="!drag || disabled"
    :tip="dragTip"
    :mask-style="dragMaskStyle"
    @upload="onUpload"
  >
    <input
      v-show="false"
      ref="inputRef"
      type="file"
      :accept="acceptRef"
      :multiple="true"
      @change="onChange"
    />
    <div :style="triggerStyle" class="trigger" @click.stop="onClick">
      <slot></slot>
    </div>
  </DragUploadModule>
</template>

<script lang="ts" setup name="UploadModule">
import DragUploadModule from '@/components/upload/UploadModule/DragUploadModule.vue';
import { ref, computed, CSSProperties } from 'vue';
import { message } from 'ant-design-vue';
import { throttle } from 'lodash-es';
import { useI18n } from 'vue-i18n';

const THROTTLE_WAIT: number = 400;

const { t } = useI18n();

interface Props {
  drag?: boolean; // 是否推拽上传
  dragTip?: string; // 拖拽鼠标悬浮文案
  dragMaskStyle?: CSSProperties; // 拖拽蒙层样式
  triggerStyle?: CSSProperties; // 自动触发上传容器样式
  maxCount?: number; // 最大上传数量
  sizeLimit?: number; // 上传文件的尺寸限制(KB)
  acceptList?: string[]; // 允许上传的文件格式列表
  autoUpload?: boolean; // 是否点击 slot 插槽元素自动触发上传
  disabled?: boolean; // 是否禁用上传
}

const props = withDefaults(defineProps<Props>(), {
  drag: false,
  maxCount: 1,
  sizeLimit: 0,
  acceptList: () => [],
  autoUpload: true,
  disabled: false,
  native: true,
});

const emits = defineEmits<{
  (e: 'upload', fileList: File[]): void;
}>();

const inputRef = ref<HTMLInputElement>();
const acceptRef = computed((): string => props.acceptList.join(','));

// 触发上传
const triggerUpload = throttle(
  () => {
    inputRef.value?.click();
  },
  THROTTLE_WAIT,
  { leading: true, trailing: false },
);

const onClick = () => {
  if (props.disabled) {
    return;
  }

  if (props.autoUpload) {
    triggerUpload();
  }
};

// 清空上传内容
const clearUpload = () => {
  if (inputRef.value) {
    inputRef.value.value = '';
  }
};

// 检查文件数量并删除超过数量上限的文件
const checkFileListMaxCount = (fileList: File[]): File[] => {
  if (!props.maxCount) {
    return fileList;
  }

  // 文件数量校验（文件数量限制大于 1 的弹提示 toast）
  if (fileList.length > props.maxCount && props.maxCount > 1) {
    const tip = t('global.uploadModule.maxFiles', { count: props.maxCount });
    message.error(tip);
  }

  return fileList.slice(0, props.maxCount);
};

// 检查文件类型过滤类型不合法的文件
const checkFileListType = (fileList: File[]): File[] => {
  if (!props.acceptList?.length) {
    return fileList;
  }

  const reg = new RegExp(`${props.acceptList.join('|')}$`, 'i');
  const list: File[] = [];
  let valid = true;
  fileList.forEach((file: File) => {
    if (!reg.test(file.name)) {
      valid = false;
      return;
    }

    list.push(file);
  });

  if (!valid) {
    const tip = t('global.uploadModule.invalidFormat', { formats: props.acceptList.join(', ') });
    message.error(tip);
  }

  return list;
};

// 检查文件大小并过滤大小不合法的文件
const checkFileListSize = (fileList: File[] = []): File[] => {
  if (!props.sizeLimit) {
    return fileList;
  }

  const rate = 1024;
  let valid = true;
  const list: File[] = [];
  fileList.forEach((file: File) => {
    if (file.size > props.sizeLimit * rate) {
      valid = false;
      return;
    }

    list.push(file);
  });

  if (!valid) {
    const unitList = ['KB', 'MB', 'GB'];
    let limit = props.sizeLimit;
    let unitIndex = 0;
    // 计算转换单位后数据的值
    while (limit > 0) {
      if (unitIndex >= unitList.length - 1 || Math.round(limit) < rate) {
        break;
      }

      unitIndex += 1;
      limit = limit / rate;
    }

    limit = Math.round(limit);
    const unit = unitList[unitIndex];

    const tip = t('global.uploadModule.maxSize', { size: `${limit}${unit}` });
    message.error(tip);
  }

  return list;
};

const onUpload = (fileList: File[]) => {
  let uploadFileList: File[];

  // 文件数量校验
  uploadFileList = checkFileListMaxCount(fileList);

  // 文件类型校验
  uploadFileList = checkFileListType(uploadFileList);

  // 文件大小校验
  uploadFileList = checkFileListSize(uploadFileList);

  // 清空上传文件
  clearUpload();

  // 上传文件列表为空，跳过
  if (!uploadFileList.length) {
    return;
  }

  emits('upload', uploadFileList);
};

const onChange = (e: any) => {
  const fileList: File[] = Array.from(e.target?.files || []);
  onUpload(fileList);
};

defineExpose({
  upload: triggerUpload,
});
</script>

<style scoped>
.trigger {
  width: 100%;
  height: 100%;
}
</style>
