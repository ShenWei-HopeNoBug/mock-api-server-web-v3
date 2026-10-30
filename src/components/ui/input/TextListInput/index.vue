<template>
  <div class="text-list-input">
    <div v-for="(_, index) in list" :key="`text_${index}`" class="text-row">
      <a-input
        v-model:value="list[index]"
        class="text-input"
        :disabled="disabled"
        placeholder="请输入"
        allow-clear
        @change="onChange"
      />
      <a-button danger shape="circle" size="small" :disabled="disabled" @click="onDelete(index)">
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
      添加一项
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';

interface Props {
  value?: string[];
  limit?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  limit: 9999,
  disabled: false,
});

const emit = defineEmits<{
  (event: 'update:value', value: string[]): void;
  (event: 'change', value: string[]): void;
}>();

const list = ref<string[]>([]);

const onChange = (): void => {
  emit('update:value', list.value);
  emit('change', list.value);
};

const onAdd = (): void => {
  if (props.disabled || list.value.length >= props.limit) {
    return;
  }
  list.value = [...list.value, ''];
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
.text-list-input {
  display: flex;
  flex-direction: column;
  width: 100%;

  .text-row {
    width: 100%;
    display: flex;
    align-items: center;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    .text-input {
      margin-right: 8px;
    }
  }
}
</style>
