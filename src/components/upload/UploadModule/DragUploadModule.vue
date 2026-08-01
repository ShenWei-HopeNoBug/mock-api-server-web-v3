<template>
  <div
    class="drag-upload-module"
    @dragenter.stop="onDragenter"
    @dragover.stop="onDragover"
    @drop.stop="onDrop"
  >
    <slot></slot>
    <div v-show="maskVisibleRef" class="mask" :style="maskStyle" @dragleave.stop="onDragleave">
      {{ tip }}
    </div>
  </div>
</template>

<script lang="ts" setup name="DragUploadModule">
import { CSSProperties, ref } from 'vue';
import i18n from '@/locales';

interface Props {
  maskStyle?: CSSProperties;
  disabled?: boolean;
  tip?: string;
}

const emits = defineEmits(['upload']);

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  tip: i18n.global.t('global.uploadModule.dropTip'),
});

const maskVisibleRef = ref<boolean>(false);

const onDragenter = (e: DragEvent) => {
  e?.preventDefault();
  if (props.disabled) {
    return;
  }

  maskVisibleRef.value = true;
};

const onDragover = (e: DragEvent) => {
  e?.preventDefault();
};

const onDragleave = (e: DragEvent) => {
  e?.preventDefault();
  maskVisibleRef.value = false;
};

const onDrop = (e: DragEvent) => {
  e?.preventDefault();
  maskVisibleRef.value = false;
  if (props.disabled) {
    return;
  }

  const fileList: File[] = Array.from(e?.dataTransfer?.files || []);
  if (!fileList.length) {
    return;
  }

  emits('upload', fileList);
};
</script>

<style scoped>
.drag-upload-module {
  width: 100%;
  position: relative;
}

.mask {
  background-color: rgba(56, 57, 60, 0.8);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
  font-size: 16px;
  color: #ffffff;
  line-height: 22px;
  font-weight: 400;

  display: flex;
  justify-content: center;
  align-items: center;
  word-break: break-word;
  user-select: none;
}
</style>
