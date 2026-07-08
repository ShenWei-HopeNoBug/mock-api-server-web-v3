<template>
  <div class="base-form" :style="baseFormScrollStyle">
    <a-form ref="formInstanceRef" :model="formState" v-bind="getFormProps(formProps)">
      <a-row
        :class="{ 'form-row': true, 'no-last-row-margin': !lastRowHasMarginBottom }"
        v-for="(list, i) in rowColumnsRef"
        :key="`row_${i}`"
        :gutter="ROW_GUTTER"
      >
        <a-col v-for="(item, j) in list" :key="`formItem_${j}`" :span="formItemCol">
          <a-form-item :label="item.label" :name="item.key" :rules="getFormItemRules(item)">
            <InputRender v-if="!item.slot" v-model:value="formState[item.key]" :options="item" />
            <slot
              v-else
              name="input"
              :form="formState"
              :key="item.key"
              :options="item"
              :columns="columns"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<script lang="ts" setup name="BaseForm">
import { ref, reactive, computed, onBeforeMount, CSSProperties } from 'vue';
import { cloneDeep } from 'lodash-es';
import InputRender from '@/components/form/InputRender/index.vue';
import type { Form as FormType, CommonObject } from '@/components/form/types';
import { FormInstance, message as AntdMessage } from 'ant-design-vue';
import { useI18n } from 'vue-i18n';
import { getRuleMessageMap } from './config.ts';
import { getFormProps, getFormScrollStyle } from '@/components/form/tools.ts';

interface Props {
  // 表单输入框配置列表
  columns: FormType.FormItemOptions[];
  // 表单项 col 布局参数
  formItemCol?: number;
  // 提交表单前处理函数
  processBeforeSubmit?: Function;
  // 提交表单是否过滤数据
  filterFormValue?: boolean;
  // 表单提交时要过滤的参数
  filterValueSet?: Set<any>;
  // 初始化表单值
  initFormValues?: CommonObject;
  // 透传给 a-form 的参数配置
  formProps?: CommonObject;
  // 最后一行是否有下边距
  lastRowHasMarginBottom?: boolean;
  scroll?: FormType.FormScroll; // 表单输入区域滚动设置
}

type RowColumns = FormType.FormItemOptions[][];

const ROW_GUTTER = 24;

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  formItemCol: 6,
  filterFormValue: false,
  initFormValues: () => ({}),
  formProps: () => ({}),
  lastRowHasMarginBottom: true,
  scroll: () => ({}),
});

const emits = defineEmits<{
  (e: 'submit', form: CommonObject): void;
}>();
const { t } = useI18n();

const formInstanceRef = ref<FormInstance | null>(null);
const formState = reactive<CommonObject>({});

// 基础表单滚动样式
const baseFormScrollStyle = computed((): CSSProperties => getFormScrollStyle(props.scroll));

// grid 布局数据源
const rowColumnsRef = computed((): RowColumns => {
  if (!props.columns?.length) {
    return [];
  }

  const step = Math.max(Math.floor(ROW_GUTTER / props.formItemCol), 1);
  const sum = props.columns.length;
  const list: RowColumns = [];
  let splitStart = 0;
  let splitEnd = step;
  // 对输入框配置按行分组
  while (splitStart < sum) {
    list.push(props.columns.slice(splitStart, splitEnd));
    splitStart += step;
    splitEnd += step;
  }

  return list;
});

// 输入项配置合法 key 集合
const inputKeySetRef = computed((): Set<string> => {
  const keySet: Set<string> = new Set();
  if (!props.columns?.length) {
    return keySet;
  }

  props.columns.forEach((o: FormType.FormItemOptions) => {
    if (o.key) {
      keySet.add(o.key);
    }
  });

  return keySet;
});

/** ------------methods*/
// 初始化表单
const initBaseFormValues = () => {
  const keyList: string[] = [...inputKeySetRef.value];
  const initValues = cloneDeep(props.initFormValues ?? {});
  keyList.forEach((key: string) => {
    if (!key) {
      return;
    }
    formState[key] = initValues[key];
  });
};

// 获取表单项校验规则
const getFormItemRules = (options: FormType.FormItemOptions) => {
  const ruleMessageMap = getRuleMessageMap();
  const {
    required = false,
    label = '',
    inputType,
    rules, // 完整的校验规则
    firstRule = {}, // 第一个校验规则
    extraRules = [], // 内置校验规则外还要补充的校验规则
  } = options;

  if (!required) {
    return [];
  }

  // 配置了完整校验规则，直接返回完整校验规则
  if (Array.isArray(rules) && rules.length > 0) {
    return rules;
  }

  const preMsg = ruleMessageMap[inputType] || t('global.form.validation.enter');
  // 内置校验规则
  const firstInnerRule = {
    required: true,
    message: `${preMsg}${label}`,
  };

  // 合并自定义和内置校验规则
  return [{ ...firstInnerRule, ...firstRule }, ...extraRules];
};

// 过滤提交表单数据
const filterSubmitFormValue = (form: CommonObject = {}) => {
  const formCp = cloneDeep(form);
  const submitForm: CommonObject = {};
  const filterValueSet = props.filterValueSet ?? new Set();

  Object.keys(formCp).forEach(key => {
    const value = formCp[key];
    // 过滤不在配置项内的数据
    if (!inputKeySetRef.value.has(key)) {
      return;
    }

    // 过滤指定数据
    if (props.filterFormValue && filterValueSet.has(value)) {
      return;
    }

    submitForm[key] = value;
  });

  return submitForm;
};

const onSubmit = () => {
  if (!formInstanceRef.value) {
    return;
  }

  formInstanceRef.value
    .validateFields()
    .then(() => {
      let submitForm = filterSubmitFormValue(formState);

      // 提交表单前置处理
      if (typeof props.processBeforeSubmit === 'function') {
        submitForm = props.processBeforeSubmit(submitForm);
      }

      emits('submit', submitForm);
    })
    .catch(() => {
      AntdMessage.error(t('global.form.validation.complete'));
    });
};

const onReset = () => {
  formInstanceRef.value?.resetFields();
};

const getFormInstance = (): FormInstance | null => formInstanceRef.value;

/** -------------life circles*/
onBeforeMount(() => {
  initBaseFormValues();
});

defineExpose({
  reset: onReset,
  submit: onSubmit,
  getFormInstance,
});
</script>

<style scoped lang="scss">
.base-form {
  width: 100%;
}

.form-row {
  width: 100%;

  :deep(.ant-form-item) {
    margin-bottom: 24px;
  }
}

.no-last-row-margin:last-child {
  :deep(.ant-form-item) {
    margin-bottom: 0;
  }
}
</style>
