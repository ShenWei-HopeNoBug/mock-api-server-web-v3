<template>
  <div class="search-form">
    <div class="form-wrapper">
      <BaseForm
        ref="baseFormRef"
        :columns="columns"
        :process-before-submit="processBeforeSubmit"
        :filter-form-value="filterFormValue"
        :filter-value-set="filterValueSet"
        :form-item-col="formItemCol"
        :init-form-values="initFormValues"
        :form-props="formProps"
        :last-row-has-margin-bottom="false"
        @submit="onSubmit"
      >
        <template #input="scoped">
          <slot name="input" v-bind="scoped" />
        </template>
      </BaseForm>
    </div>
    <div class="tools">
      <div>
        <a-button style="margin-right: 8px" @click="onReset">
          {{ t('global.form.action.reset') }}
        </a-button>
        <a-button type="primary" :loading="loading" @click="onSearch">
          {{ t('global.form.action.search') }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="SearchForm">
import BaseForm from '@/components/form/BaseForm/index.vue';
import type { Form as FormType, CommonObject } from '@/components/form/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  columns: FormType.FormItemOptions[];
  processBeforeSubmit?: (form: Record<string, any>) => Record<string, any>;
  filterFormValue?: boolean;
  filterValueSet?: Set<any>;
  loading?: boolean;
  initFormValues?: CommonObject;
  formProps?: CommonObject;
  formItemCol?: number;
}

const emits = defineEmits(['submit']);
const { t } = useI18n();

const baseFormRef = ref<InstanceType<typeof BaseForm> | null>(null);

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  filterFormValue: true,
  filterValueSet: () => new Set([undefined, null, '']),
  loading: false,
  initFormValues: () => ({}),
  formProps: () => ({}),
  formItemCol: 8,
});

const onSearch = () => {
  if (props.loading) {
    return;
  }

  baseFormRef.value?.submit?.();
};

const onReset = () => {
  if (props.loading) {
    return;
  }

  baseFormRef.value?.reset?.();
  onSearch();
};

const onSubmit = (form: CommonObject = {}) => {
  emits('submit', form);
};
</script>

<style scoped lang="scss">
.search-form {
  width: 100%;
  display: flex;
  justify-content: space-between;

  .form-wrapper {
    flex: 1;
  }

  .tools {
    display: flex;
    flex-direction: row-reverse;
    width: 200px;
  }
}
</style>
