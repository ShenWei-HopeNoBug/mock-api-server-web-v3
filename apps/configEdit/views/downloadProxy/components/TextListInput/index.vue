<template>
  <div class="text-list-input">
    <div v-for="(item, index) in value" :key="index" class="text-row">
      <a-input
        :value="item"
        placeholder="请输入"
        allow-clear
        @update:value="onUpdate(index, $event)"
      />
      <a-button danger shape="circle" size="small" @click="onDelete(index)">
        <template #icon><MinusOutlined /></template>
      </a-button>
    </div>
    <a-button type="dashed" block @click="onAdd">
      <template #icon><PlusOutlined /></template>
      添加一项
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';

interface Props {
  value?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
});

const emit = defineEmits<{
  (event: 'update:value', value: string[]): void;
}>();

const onUpdate = (index: number, value: string): void => {
  const list = [...props.value];
  list[index] = value;
  emit('update:value', list);
};

const onAdd = (): void => {
  emit('update:value', [...props.value, '']);
};

const onDelete = (index: number): void => {
  emit('update:value', props.value.filter((_, itemIndex) => itemIndex !== index));
};
</script>

<style scoped lang="scss">
.text-list-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.text-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
