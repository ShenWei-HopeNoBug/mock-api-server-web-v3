<template>
  <div class="proxy-list-input">
    <div
      v-for="(item, index) in value"
      :key="index"
      class="proxy-row"
      :class="{ 'proxy-row--invalid': !isDownloadProxyValid(item) }"
    >
      <div class="row-index">#{{ index + 1 }}</div>
      <ProxyConfigInput :value="item" @update:value="onUpdate(index, $event)" />
      <a-button
        danger
        shape="circle"
        size="small"
        class="remove-button"
        @click="onDelete(index)"
      >
        <template #icon><MinusOutlined /></template>
      </a-button>
    </div>
    <a-button type="dashed" block @click="onAdd">
      <template #icon><PlusOutlined /></template>
      添加代理
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep } from 'lodash-es';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { defaultDownloadProxy } from '../../config';
import { isDownloadProxyValid } from '../../tools';
import ProxyConfigInput from '../ProxyConfigInput/index.vue';

interface Props {
  value?: DownloadProxyType.ProxyConfig[];
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
});

const emit = defineEmits<{
  (event: 'update:value', value: DownloadProxyType.ProxyConfig[]): void;
}>();

const onUpdate = (index: number, value: DownloadProxyType.ProxyConfig): void => {
  const list = [...props.value];
  list[index] = value;
  emit('update:value', list);
};

const onAdd = (): void => {
  emit('update:value', [...props.value, cloneDeep(defaultDownloadProxy)]);
};

const onDelete = (index: number): void => {
  emit('update:value', props.value.filter((_, itemIndex) => itemIndex !== index));
};
</script>

<style scoped lang="scss">
.proxy-list-input {
  width: 100%;
}

.proxy-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &--invalid {
    border: 1px solid #ff4d4f;
    border-radius: 4px;
    padding: 12px 8px;
  }

  &:first-child {
    padding-top: 0;
  }
}

.row-index {
  flex: 0 0 36px;
  padding-top: 8px;
  font-weight: 600;
}

.remove-button {
  margin-top: 4px;
}
</style>
