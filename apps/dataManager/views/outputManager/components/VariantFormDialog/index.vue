<template>
  <a-modal
    v-model:visible="visible"
    :title="modalTitle"
    :width="'calc(100vw - 200px)'"
    :footer="null"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    @cancel="close"
  >
    <div v-if="visible" class="form-content" v-dom-resize="onFormResize">
      <div class="form-scroll" v-jump-forbid>
        <BaseForm
          ref="baseFormRef"
          :columns="formColumns"
          :init-form-values="initFormValues"
          :process-before-submit="processBeforeSubmit"
          :form-item-col="24"
          :form-props="formProps"
          @submit="onFormSubmit"
        >
          <template #input="scoped">
            <template v-if="scoped.options.key === 'response'">
              <JsonInput
                ref="responseRef"
                v-model:value="scoped.form[scoped.options.key]"
                :code-editor-style="{ height: formResponseHeight }"
                default-copy-content="{}"
              />
            </template>
          </template>
        </BaseForm>
      </div>
    </div>

    <div class="form-footer">
      <a-button type="primary" :loading="formLoading" @click="triggerFormSubmit">确定</a-button>
    </div>
  </a-modal>
</template>

<script lang="ts" setup name="VariantFormDialog">
import { computed, ref } from 'vue';
import { cloneDeep, isPlainObject } from 'lodash-es';
import { message } from 'ant-design-vue';
import BaseForm from '@/components/form/BaseForm/index.vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import type { VariantFormDialogType } from './type';
import { getDefaultVariantValues, processBeforeSubmit, formProps } from './config';
import { useFormColumns } from './useFormColumns';
import { useOutputManagerApi } from '@apps/dataManager/views/outputManager/hooks/useOutputManagerApi';

interface Props {
  apiDataId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  apiDataId: '',
});

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const { formColumns } = useFormColumns();
const { addVariant, updateVariant } = useOutputManagerApi();

const visible = ref<boolean>(false);
const isEditRef = ref<boolean>(false);
const formLoading = ref<boolean>(false);
const editingVariantId = ref<string>('');
const initFormValues = ref<Record<string, any>>({});
const formResponseHeight = ref<string>('300px');

const baseFormRef = ref<InstanceType<typeof BaseForm> | null>(null);
const responseRef = ref<InstanceType<typeof JsonInput> | null>(null);

const modalTitle = computed<string>(() => (isEditRef.value ? '编辑变体' : '新增变体'));

const show = (options: VariantFormDialogType.ShowOptions = {}): void => {
  const { isEdit = false, record = {} } = options;
  isEditRef.value = isEdit;
  editingVariantId.value = record?.id || '';
  const initFormData: Record<string, any> = isPlainObject(record) ? cloneDeep(record) : {};
  initFormValues.value = {
    ...getDefaultVariantValues(),
    ...initFormData,
  };
  visible.value = true;
};

const close = (): void => {
  visible.value = false;
  isEditRef.value = false;
  editingVariantId.value = '';
  formLoading.value = false;
};

const onFormResize = (entry: ResizeObserverEntry): void => {
  if (!entry?.target) {
    return;
  }
  const { height } = entry.target.getBoundingClientRect();
  const offset = 60;
  const minHeight = 100;
  formResponseHeight.value = `${Math.max(minHeight, height - offset)}px`;
};

const triggerFormSubmit = (): void => {
  const responseValid = responseRef.value?.validate?.();
  if (!responseValid) {
    message.error('响应数据输入的 json 不合法');
    return;
  }
  baseFormRef.value?.submit?.();
};

const onFormSubmit = (form: Record<string, any> = {}): void => {
  const submitData = processBeforeSubmit(form);
  formLoading.value = true;

  if (isEditRef.value) {
    updateVariant({ id: editingVariantId.value, ...submitData })
      .then(res => {
        if (res) {
          message.success('更新变体成功');
          close();
          emits('success');
        } else {
          message.error('更新变体失败');
        }
      })
      .finally(() => {
        formLoading.value = false;
      });
  } else {
    addVariant({ api_data_id: props.apiDataId, ...submitData })
      .then(res => {
        if (res) {
          message.success('新增变体成功');
          close();
          emits('success');
        } else {
          message.error('新增变体失败');
        }
      })
      .finally(() => {
        formLoading.value = false;
      });
  }
};

defineExpose({
  show,
  close,
});
</script>

<style scoped lang="scss">
.form-content {
  width: 100%;
  height: calc(100vh - 280px);
  min-height: 200px;
  padding-right: 8px;
  scrollbar-gutter: stable;
  word-break: break-word;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.form-scroll {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overflow-y: auto;
}

.form-footer {
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  margin-top: 14px;
}
</style>
