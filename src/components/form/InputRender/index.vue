<template>
  <span v-if="visibleRef">
    <a-input
      v-if="options?.inputType === 'input'"
      v-model:value="valueRef"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
    <a-textarea
      v-if="options?.inputType === 'textarea'"
      v-model:value="valueRef"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
    <a-select
      v-else-if="options?.inputType === 'select'"
      v-model:value="valueRef"
      :options="options?.options"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
    <a-range-picker
      v-else-if="options?.inputType === 'rangePicker'"
      v-model:value="valueRef"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
    <a-date-picker
      v-else-if="options?.inputType === 'datePicker'"
      v-model:value="valueRef"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
    <a-input-number
      v-else-if="options?.inputType === 'inputNumber'"
      v-model:value="valueRef"
      v-bind="getFormInputProps(options)"
      @change="onChange"
    />
  </span>
</template>

<script lang="ts" setup name="InputRender">
import { ref, computed, watch } from 'vue';
import { getFormInputProps } from '@/components/form/tools.ts';
import { inputTypeSet } from './config.ts';
import type { Form as FormType } from '@/components/form/types';

interface Props {
  options: FormType.FormInputOptions;
  value?: any;
}

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: 'update:value', value: any): void;
  (e: 'change', value: any): void;
}>();

const valueRef = ref<any>();

const visibleRef = computed((): boolean => inputTypeSet.has(props.options?.inputType));

const onChange = () => {
  emits('update:value', valueRef.value);
  emits('change', valueRef.value);
};

watch(
  () => props.value,
  (val: any) => {
    valueRef.value = val;
  },
  { immediate: true, deep: true },
);
</script>
