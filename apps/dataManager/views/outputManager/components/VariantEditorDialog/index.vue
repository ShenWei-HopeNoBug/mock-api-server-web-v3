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
    <div class="container">
      <div class="toolbar">
        <a-button type="primary" @click="onAdd">新增变体</a-button>
      </div>
      <div class="content">
        <a-table
          :columns="variantTableColumns"
          :data-source="variantList"
          :pagination="false"
          :loading="tableLoading"
          row-key="id"
          :scroll="{ x: 1000, y: tableHeight }"
        >
          <template #bodyCell="{ column, record, index }">
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
      </div>
    </div>

    <VariantFormDialog
      ref="variantFormDialogRef"
      :api-data-id="apiDataId"
      @success="fetchVariants"
    />
  </a-modal>
</template>

<script lang="ts" setup name="VariantEditorDialog">
import { nextTick, ref } from 'vue';
import { message } from 'ant-design-vue';
import VariantFormDialog from '../VariantFormDialog/index.vue';
import type { VariantEditorDialogType } from './type';
import { variantTableColumns } from './config';
import { useOutputManagerApi } from '../../hooks/useOutputManagerApi';
import { generateUUID } from '@/utils';

const emits = defineEmits<{
  (e: 'close'): void;
}>();

const { getMockDataDetail, updateVariant, deleteVariant } = useOutputManagerApi();

const visible = ref<boolean>(false);
const tableLoading = ref<boolean>(false);
const variantList = ref<VariantEditorDialogType.VariantRecord[]>([]);
const apiDataId = ref<string>('');

const tableHeight = ref<number>(400);

const modalTitle = '响应变体管理';

const variantFormDialogRef = ref<InstanceType<typeof VariantFormDialog> | null>(null);

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
  variantFormDialogRef.value?.close?.();
  emits('close');
};

// --- 新增/编辑表单弹窗 ---

const onAdd = (): void => {
  variantFormDialogRef.value?.show?.();
};

const onEdit = (record: VariantEditorDialogType.VariantRecord): void => {
  variantFormDialogRef.value?.show?.({ isEdit: true, record });
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
.container {
  width: 100%;
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .toolbar {
    width: 100%;
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  .content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    flex: 1;
  }

  .operation {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
  }
}
</style>
