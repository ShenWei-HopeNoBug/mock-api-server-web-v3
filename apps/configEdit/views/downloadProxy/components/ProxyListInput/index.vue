<template>
  <div class="proxy-list-input">
    <div
      v-for="(item, index) in list"
      :key="`proxy_${index}`"
      class="proxy-row"
      :class="{ 'proxy-row--invalid': !isDownloadProxyValid(item) }"
    >
      <div class="row-index">#{{ index + 1 }}</div>
      <ProxyConfigInput v-model:value="list[index]" :disabled="disabled" @change="onChange" />
      <a-button
        danger
        shape="circle"
        size="small"
        class="remove-button"
        :disabled="disabled"
        @click="onDelete(index)"
      >
        <template #icon><MinusOutlined /></template>
      </a-button>
    </div>
    <a-button
      v-if="list.length < (limit || 0)"
      type="dashed"
      block
      :disabled="disabled"
      @click="onAdd"
    >
      <template #icon><PlusOutlined /></template>
      添加代理
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { getDefaultDownloadProxy } from '../../config';
import { isDownloadProxyValid } from '../../tools';
import ProxyConfigInput from '../ProxyConfigInput/index.vue';

interface Props {
  value?: DownloadProxyType.ProxyConfig[];
  limit?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  limit: 9999,
  disabled: false,
});

const emit = defineEmits<{
  (event: 'update:value', value: DownloadProxyType.ProxyConfig[]): void;
  (event: 'change', value: DownloadProxyType.ProxyConfig[]): void;
}>();

const list = ref<DownloadProxyType.ProxyConfig[]>([]);

const onChange = (): void => {
  emit('update:value', list.value);
  emit('change', list.value);
};

const onAdd = (): void => {
  if (props.disabled || list.value.length >= props.limit) {
    return;
  }
  list.value = [...list.value, getDefaultDownloadProxy()];
  onChange();
};

const onDelete = (index: number): void => {
  if (props.disabled) {
    return;
  }
  list.value = list.value.filter((_, itemIndex) => itemIndex !== index);
  onChange();
};

watch(
  () => props.value,
  arr => {
    if (Array.isArray(arr)) {
      list.value = arr;
    } else {
      onChange();
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.proxy-list-input {
  width: 100%;
  flex-shrink: 0;
}

.proxy-row {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;

  &:not(:last-child) {
    margin-bottom: 14px;
  }

  .row-index {
    margin-right: 8px;
  }

  .remove-button {
    margin-left: 8px;
  }

  &--invalid {
    border-color: #ff4d4f;
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
