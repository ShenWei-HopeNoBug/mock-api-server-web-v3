<template>
  <a-modal
    v-model:visible="visible"
    :title="modalTitle"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    wrap-class-name="output-manager-variant-editor-dialog"
    @cancel="close"
  >
    <Spin :spinning="tableLoading">
      <div class="toolbar">
        <a-button type="primary" @click="onAdd">新增变体</a-button>
      </div>
      <a-table
        :columns="variantTableColumns"
        :data-source="variantList"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1000, y: tableHeight }"
      >
        <template #bodyCell="{ text, column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>

          <template v-else-if="column.key === 'enabled'">
            <a-tag :color="record.enabled ? 'green' : 'red'">
              {{ record.enabled ? '启用' : '禁用' }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'operation'">
            <div class="operation">
              <a-popconfirm
                :title="record.enabled ? '确认禁用？' : '确认启用？'"
                @confirm="onToggleEnabled(record)"
              >
                <a-button :danger="record.enabled" type="link">
                  {{ record.enabled ? '禁用' : '启用' }}
                </a-button>
              </a-popconfirm>

              <a-button type="link" @click="onEdit(record)">编辑</a-button>

              <a-popconfirm title="确认删除？" @confirm="onDelete(record)">
                <a-button danger type="link">删除</a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </Spin>

    <!-- 新增/编辑变体的内嵌弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="formIsEdit ? '编辑变体' : '新增变体'"
      :width="'calc(100vw - 200px)'"
      :footer="null"
      :mask-closable="false"
      :keyboard="false"
      centered
      destroy-on-close
      @cancel="closeForm"
    >
      <div v-if="formVisible" class="form-content" v-dom-resize="onFormResize">
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
              <template v-else-if="scoped.options.key === 'response'">
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
  </a-modal>
</template>

<script lang="ts" setup name="VariantEditorDialog">
import { computed, nextTick, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import BaseForm from '@/components/form/BaseForm/index.vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import Spin from '@/components/Spin/index.vue';
import type { VariantEditorDialogType } from './type';
import type { DataManagerType } from '#/qt/dataManager';
import {
  getDefaultVariantValues,
  processBeforeSubmit,
  formProps,
  variantTableColumns,
} from './config';
import { useFormColumns } from './useFormColumns';
import { useOutputManagerApi } from '../../hooks/useOutputManagerApi';
import { generateUUID } from '@/utils';

const emits = defineEmits<{
  (e: 'close'): void;
}>();

const { formColumns } = useFormColumns();
const { getMockDataDetail, addVariant, updateVariant, deleteVariant } = useOutputManagerApi();

const visible = ref<boolean>(false);
const tableLoading = ref<boolean>(false);
const variantList = ref<VariantEditorDialogType.VariantRecord[]>([]);
const apiDataId = ref<string>('');
const apiDataUrl = ref<string>('');

const tableHeight = ref<number>(400);

// --- 内嵌表单弹窗状态 ---
const formVisible = ref<boolean>(false);
const formIsEdit = ref<boolean>(false);
const formLoading = ref<boolean>(false);
const editingVariantId = ref<string>('');
const initFormValues = ref<Record<string, any>>({});
const formResponseHeight = ref<string>('300px');

const baseFormRef = ref<InstanceType<typeof BaseForm> | null>(null);
const responseRef = ref<InstanceType<typeof JsonInput> | null>(null);

const modalTitle = computed<string>(() => {
  const url = apiDataUrl.value || '';
  return url ? `响应变体管理 - ${url}` : '响应变体管理';
});

// --- 数据加载 ---

const fetchVariants = (): void => {
  if (!apiDataId.value) {
    return;
  }
  const token = generateUUID();
  tableLoading.value = true;

  getMockDataDetail({ id: apiDataId.value })
    .then(res => {
      variantList.value = Array.isArray(res?.response_variants) ? res.response_variants : [];
    })
    .catch(() => {
      message.error('获取变体列表失败');
      variantList.value = [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
};

// --- 弹窗打开/关闭 ---

const show = (options: VariantEditorDialogType.ShowOptions = {}): void => {
  apiDataId.value = options.apiDataId || '';
  apiDataUrl.value = options.apiDataUrl || '';
  variantList.value = [];
  visible.value = true;
  nextTick(() => {
    fetchVariants();
  });
};

const close = (): void => {
  visible.value = false;
  variantList.value = [];
  apiDataId.value = '';
  apiDataUrl.value = '';
  formVisible.value = false;
  formIsEdit.value = false;
  editingVariantId.value = '';
  emits('close');
};

// --- 新增/编辑表单弹窗 ---

const onAdd = (): void => {
  formIsEdit.value = false;
  editingVariantId.value = '';
  initFormValues.value = getDefaultVariantValues();
  formVisible.value = true;
};

const onEdit = (record: VariantEditorDialogType.VariantRecord): void => {
  formIsEdit.value = true;
  editingVariantId.value = record.id || '';
  initFormValues.value = {
    ...getDefaultVariantValues(),
    ...cloneDeep(record),
  };
  formVisible.value = true;
};

const closeForm = (): void => {
  formVisible.value = false;
  formIsEdit.value = false;
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

  if (formIsEdit.value) {
    updateVariant({ id: editingVariantId.value, ...submitData })
      .then(res => {
        if (res) {
          message.success('更新变体成功');
          closeForm();
          fetchVariants();
        } else {
          message.error('更新变体失败');
        }
      })
      .finally(() => {
        formLoading.value = false;
      });
  } else {
    addVariant({ api_data_id: apiDataId.value, ...submitData })
      .then(res => {
        if (res) {
          message.success('新增变体成功');
          closeForm();
          fetchVariants();
        } else {
          message.error('新增变体失败');
        }
      })
      .finally(() => {
        formLoading.value = false;
      });
  }
};

// --- 启用/禁用切换 ---

const onToggleEnabled = (record: VariantEditorDialogType.VariantRecord): void => {
  const nextEnabled = !record.enabled;
  updateVariant({ id: record.id, enabled: nextEnabled }).then(res => {
    if (res) {
      message.success(nextEnabled ? '启用成功' : '禁用成功');
      fetchVariants();
    } else {
      message.error('切换启用状态失败');
    }
  });
};

// --- 删除 ---

const onDelete = (record: VariantEditorDialogType.VariantRecord): void => {
  deleteVariant({ id: record.id }).then(res => {
    if (res) {
      message.success('删除变体成功');
      fetchVariants();
    } else {
      message.error('删除变体失败');
    }
  });
};

defineExpose({
  show,
  close,
});
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 14px;
}

.operation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

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
