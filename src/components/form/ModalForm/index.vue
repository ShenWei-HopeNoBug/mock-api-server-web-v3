<template>
  <a-modal
    v-model:visible="visibleRef"
    :title="title"
    :footer="false"
    :keyboard="false"
    :destroyOnClose="true"
    :mask-closable="false"
    v-bind="$attrs"
  >
    <div class="content">
      <BaseForm
        ref="baseFormRef"
        :columns="columns"
        :processBeforeSubmit="processBeforeSubmit"
        :filter-form-value="filterFormValue"
        :filter-value-set="filterValueSet"
        :init-form-values="initFormValues"
        :form-item-col="formItemCol"
        :form-props="formProps"
        :last-row-has-margin-bottom="true"
        :scroll="scroll"
        @submit="onSubmit"
      >
        <template #input="scoped">
          <slot name="input" v-bind="scoped" />
        </template>
      </BaseForm>
    </div>
    <slot name="footer">
      <div class="footer">
        <div>
          <a-button @click="onReset" style="margin-right: 8px">{{ t('global.form.action.reset') }}</a-button>
          <a-button type="primary" :loading="loading" @click="onSave">{{ t('global.form.action.save') }}</a-button>
        </div>
      </div>
    </slot>
  </a-modal>
</template>

<script lang="ts" setup name="ModalForm">
import BaseForm from '@/components/form/BaseForm/index.vue';
import { ref } from 'vue';
import type { Form as FormType, CommonObject } from '@/components/form/types';
import { Modal } from 'ant-design-vue';
import { useI18n } from 'vue-i18n';
import i18n from '@/locales';

const { t } = useI18n();

interface Props {
  title?: string;
  columns: FormType.FormItemOptions[];
  processBeforeSubmit?: Function;
  filterFormValue?: boolean;
  filterValueSet?: Set<any>;
  loading?: boolean;
  initFormValues?: CommonObject;
  closeAfterSubmit?: boolean; // 提交表单后是否直接关闭弹窗
  formProps?: CommonObject;
  formItemCol?: number;
  scroll?: FormType.FormScroll; // 表单输入区域滚动设置
}

const emits = defineEmits(['submit']);

const baseFormRef = ref<InstanceType<typeof BaseForm> | null>(null);

const props = withDefaults(defineProps<Props>(), {
  title: i18n.global.t('global.form.modal.defaultTitle'),
  columns: () => [],
  filterFormValue: true,
  filterValueSet: () => new Set([undefined, null, '']),
  loading: false,
  initFormValues: () => ({}),
  closeAfterSubmit: false,
  formProps: () => ({}),
  formItemCol: 24,
  scroll: () => ({}),
});

const visibleRef = ref<boolean>(false);

const onShow = () => {
  visibleRef.value = true;
};

const onClose = () => {
  visibleRef.value = false;
};

const onReset = () => {
  if (props.loading) {
    return;
  }

  // 重置表单二次确认
  Modal.confirm({
    title: t('global.form.modal.confirmTitle'),
    content: t('global.form.modal.confirmReset'),
    centered: true,
    onOk: () => {
      baseFormRef.value?.reset?.();
    },
  });
};

const onSave = () => {
  if (props.loading) {
    return;
  }

  baseFormRef.value?.submit?.();
};

const onSubmit = (form: CommonObject = {}) => {
  emits('submit', form);

  if (props.closeAfterSubmit) {
    visibleRef.value = false;
  }
};

defineExpose({
  show: onShow,
  close: onClose,
});
</script>

<style scoped lang="scss">
.content {
  padding-top: 14px;
  margin-bottom: 24px;
}

.footer {
  display: flex;
  flex-direction: row-reverse;
}
</style>
