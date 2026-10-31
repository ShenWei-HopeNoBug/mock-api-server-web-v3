<template>
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '编辑 Mock 接口' : '新增 Mock 接口'"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    root-class-name="output-manager-user-api-editor-dialog"
    @cancel="close"
  >
    <div v-if="visible" v-dom-resize="onResize" class="content">
      <div v-jump-forbid class="scroll">
        <BaseForm
          ref="baseFormRef"
          :columns="formColumns"
          :init-form-values="initFormValues"
          :process-before-submit="processBeforeSubmit"
          :form-item-col="24"
          :form-props="formProps"
          @submit="onSubmit"
        >
          <template #input="scoped">
            <template v-if="scoped.options.key === 'params'">
              <JsonInput
                ref="paramsRef"
                v-model:value="scoped.form[scoped.options.key]"
                :readonly="isMitmproxy"
                :code-editor-style="{ height: '300px' }"
                default-copy-content="{}"
              />
            </template>

            <template v-else-if="scoped.options.key === 'response'">
              <JsonInput
                ref="responseRef"
                v-model:value="scoped.form[scoped.options.key]"
                :readonly="isMitmproxy"
                :code-editor-style="{ height: previewHeight }"
                default-copy-content="{}"
              />
            </template>
          </template>
        </BaseForm>
      </div>
    </div>

    <div class="footer">
      <a-button type="primary" :loading="loading" @click="triggerSubmit">确定</a-button>
    </div>
  </a-modal>
</template>

<script lang="ts" setup name="UserApiEditorDialog">
import { computed, nextTick, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import BaseForm from '@/components/form/BaseForm/index.vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import type { OutputManagerType } from '../../type';
import type { UserApiEditorDialogType } from './type';
import { getDefaultFormValues, processBeforeSubmit, formProps } from './config';
import { useFormColumns } from './useFormColumns';

interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emits = defineEmits<{
  (e: 'submit', payload: UserApiEditorDialogType.SubmitPayload): void;
  (e: 'close', isEdit: boolean): void;
}>();

const baseFormRef = ref<InstanceType<typeof BaseForm> | null>(null);
const paramsRef = ref<InstanceType<typeof JsonInput> | null>(null);
const responseRef = ref<InstanceType<typeof JsonInput> | null>(null);

const visible = ref<boolean>(false);
const previewHeight = ref<string>('300px');
const showOptions = ref<UserApiEditorDialogType.ShowOptions>({ isEdit: false });
const initFormValues = ref<OutputManagerType.RowRecord>({});

const { recordType, isMitmproxy, formColumns } = useFormColumns();

const isEdit = computed<boolean>(() => Boolean(showOptions.value?.isEdit || false));

// 重置弹窗内部状态
const initStates = (): void => {
  previewHeight.value = '300px';
  showOptions.value = { isEdit: false };
  recordType.value = 'USER';
};

// 内容区尺寸变化时，动态调整 Response 编辑区高度
const onResize = (entry: ResizeObserverEntry): void => {
  if (!entry?.target) {
    return;
  }

  const { height } = entry.target.getBoundingClientRect();
  const offset = 60;
  const minHeight = 100;
  previewHeight.value = `${Math.max(minHeight, height - offset)}px`;
};

// 打开弹窗并初始化表单数据
const show = (options: UserApiEditorDialogType.ShowOptions = {}): void => {
  initStates();
  showOptions.value = options || { isEdit: true };
  recordType.value = options?.recordType || 'USER';

  const formData = isEdit.value ? cloneDeep(options?.formData ?? {}) : getDefaultFormValues();
  initFormValues.value = {
    ...getDefaultFormValues(),
    ...(formData || {}),
    type: recordType.value,
  };

  nextTick(() => {
    visible.value = true;
  });
};

// 关闭弹窗并通知父组件
const close = (): void => {
  visible.value = false;
  emits('close', isEdit.value);
};

// 校验 Params/Response 的 JSON 合法性
const checkJsonValid = (): boolean => {
  const paramsValid = paramsRef.value?.validate?.();
  if (!paramsValid) {
    message.error('Params 输入的 json 不合法');
    return false;
  }

  const responseValid = responseRef.value?.validate?.();
  if (!responseValid) {
    message.error('Response 输入的 json 不合法');
    return false;
  }

  return true;
};

// 提交入口：先校验 JSON，再触发表单提交
const triggerSubmit = (): void => {
  if (!checkJsonValid()) {
    return;
  }

  baseFormRef.value?.submit?.();
};

// 转发提交事件给父组件
const onSubmit = (form: OutputManagerType.RowRecord = {}): void => {
  emits('submit', {
    form,
    isEdit: isEdit.value,
  });
};

defineExpose({
  show,
  close,
});
</script>

<style scoped lang="scss">
.content {
  width: 100%;
  height: calc(100vh - 210px);
  min-height: 200px;
  padding-right: 8px;
  scrollbar-gutter: stable;
  word-break: break-word;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.scroll {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overflow-y: auto;
}

.footer {
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  margin-top: 14px;
}
</style>
