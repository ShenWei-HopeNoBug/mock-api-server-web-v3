<template>
  <a-modal
    v-model:visible="visible"
    title="响应变体管理"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    wrap-class-name="output-manager-variant-editor-dialog"
    @cancel="close"
  >
    <div class="container" :class="{ 'is-sort-mode': isSortMode }">
      <div class="toolbar">
        <a-button type="primary" :disabled="isSortMode" @click="onAdd">新增变体</a-button>
        <a-button
          :type="isSortMode ? 'default' : 'dashed'"
          :disabled="tableLoading"
          @click="toggleSortMode"
        >
          {{ isSortMode ? '退出排序' : '拖拽排序' }}
        </a-button>
        <a-button
          v-if="isSortMode && hasOrderChanged"
          type="primary"
          :loading="isSavingSort"
          @click="onSaveSort"
        >
          保存排序
        </a-button>
      </div>
      <div class="content" v-dom-resize="onResize">
        <a-table
          :columns="currentColumns"
          :data-source="variantList"
          :pagination="false"
          :loading="tableLoading"
          row-key="id"
          :scroll="{ x: 1000, y: tableHeight }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'dragHandle'">
              <div class="drag-handle" :class="{ 'drag-handle--active': isSortMode }">
                <span class="drag-handle__icon">&#8942;&#8942;</span>
              </div>
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
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { message } from 'ant-design-vue';
import Sortable from 'sortablejs';
import type { Sortable as SortableType } from 'sortablejs';
import VariantFormDialog from '@apps/dataManager/views/outputManager/components/VariantFormDialog/index.vue';
import type { VariantEditorDialogType } from './type';
import { variantTableColumns } from '@apps/dataManager/views/outputManager/components/VariantFormDialog/config';
import { useOutputManagerApi } from '@apps/dataManager/views/outputManager/hooks/useOutputManagerApi';
import { generateUUID } from '@/utils';

const emits = defineEmits<{
  (e: 'close'): void;
}>();

const { getMockDataDetail, updateVariant, deleteVariant, reorderVariants } = useOutputManagerApi();

const visible = ref<boolean>(false);
const tableLoading = ref<boolean>(false);
const variantList = ref<VariantEditorDialogType.VariantRecord[]>([]);
const apiDataId = ref<string>('');

const variantFormDialogRef = ref<InstanceType<typeof VariantFormDialog> | null>(null);
const tableHeight = ref<number>(400);
const currentRequestToken = ref<string>(generateUUID());

// --- 拖拽排序相关状态 ---
const isSortMode = ref<boolean>(false);
const isSavingSort = ref<boolean>(false);
const hasOrderChanged = ref<boolean>(false);
const originalVariantIds = ref<string[]>([]);
let sortableInstance: SortableType | null = null;
const sortRequestToken = ref<string>(generateUUID());

const currentColumns = computed(() => {
  if (isSortMode.value) {
    return variantTableColumns.filter(col => col.key !== 'operation');
  }
  return variantTableColumns;
});

// 内容区尺寸变化时，动态调整 Response 编辑区高度
const onResize = (entry: ResizeObserverEntry): void => {
  if (!entry?.target) {
    return;
  }

  const { height } = entry.target.getBoundingClientRect();
  const offset = 60;
  const minHeight = 100;
  tableHeight.value = Math.max(minHeight, height - offset);
};

// --- 数据加载 ---

const fetchVariants = (): void => {
  if (!apiDataId.value) {
    return;
  }
  const token = generateUUID();
  currentRequestToken.value = token;
  tableLoading.value = true;

  getMockDataDetail({ id: apiDataId.value })
    .then(res => {
      if (currentRequestToken.value !== token) {
        return;
      }
      variantList.value = Array.isArray(res?.response_variants) ? res.response_variants : [];
    })
    .catch(() => {
      if (currentRequestToken.value !== token) {
        return;
      }
      message.error('获取变体列表失败');
      variantList.value = [];
    })
    .finally(() => {
      if (currentRequestToken.value === token) {
        tableLoading.value = false;
      }
    });
};

// --- 拖拽排序 ---

const destroySortable = (): void => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
};

const initSortable = (): void => {
  const tableBody = document.querySelector(
    '.output-manager-variant-editor-dialog .ant-table-tbody',
  );
  if (!tableBody) {
    return;
  }

  sortableInstance = Sortable.create(tableBody as HTMLElement, {
    animation: 200,
    handle: '.drag-handle--active',
    draggable: '.ant-table-row',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: ({ oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return;
      }
      const list = [...variantList.value];
      const [moved] = list.splice(oldIndex, 1);
      list.splice(newIndex, 0, moved);
      variantList.value = list;
      checkOrderChanged();
    },
  });
};

const checkOrderChanged = (): void => {
  const currentIds = variantList.value.map(v => v.id!);
  hasOrderChanged.value = currentIds.some((id, i) => id !== originalVariantIds.value[i]);
};

const toggleSortMode = (): void => {
  if (isSortMode.value) {
    destroySortable();
    isSortMode.value = false;
    hasOrderChanged.value = false;
    return;
  }
  isSortMode.value = true;
  hasOrderChanged.value = false;
  originalVariantIds.value = variantList.value.map(v => v.id!);
  nextTick(() => {
    initSortable();
  });
};

const onSaveSort = (): void => {
  if (!hasOrderChanged.value || !apiDataId.value || isSavingSort.value) {
    return;
  }

  const token = generateUUID();
  sortRequestToken.value = token;
  isSavingSort.value = true;

  const variantIds = variantList.value.map(v => v.id!);
  reorderVariants({ api_data_id: apiDataId.value, variant_ids: variantIds })
    .then(res => {
      if (sortRequestToken.value !== token) {
        return;
      }
      if (res) {
        message.success('排序保存成功');
        destroySortable();
        isSortMode.value = false;
        hasOrderChanged.value = false;
        nextTick(() => {
          fetchVariants();
        });
      } else {
        message.error('排序保存失败');
      }
    })
    .finally(() => {
      if (sortRequestToken.value === token) {
        isSavingSort.value = false;
      }
    });
};

// --- 弹窗打开/关闭 ---

const resetStates = (): void => {
  variantList.value = [];
  currentRequestToken.value = generateUUID();
  tableLoading.value = false;
  apiDataId.value = '';
  destroySortable();
  isSortMode.value = false;
  isSavingSort.value = false;
  hasOrderChanged.value = false;
  originalVariantIds.value = [];
  sortRequestToken.value = generateUUID();
};

const show = (options: VariantEditorDialogType.ShowOptions = {}): void => {
  resetStates();
  apiDataId.value = options.apiDataId || '';
  visible.value = true;
  nextTick(() => {
    fetchVariants();
  });
};

const close = (): void => {
  visible.value = false;
  resetStates();
  variantFormDialogRef.value?.close?.();
  emits('close');
};

// --- 新增/编辑表单弹窗 ---

const onAdd = (): void => {
  variantFormDialogRef.value?.show?.({ isEdit: false });
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

onBeforeUnmount(() => {
  destroySortable();
});

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
    display: flex;
    align-items: center;
    gap: 8px;
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

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    color: #d9d9d9;
    cursor: not-allowed;
    user-select: none;
    transition: color 0.2s;

    &--active {
      color: #1890ff;
      cursor: move;
    }

    &__icon {
      font-size: 16px;
      letter-spacing: -2px;
      line-height: 1;
    }
  }

  &.is-sort-mode {
    :deep(.ant-table-tbody) {
      .ant-table-row {
        &:hover {
          background-color: #e6f7ff;
        }
      }

      .sortable-ghost {
        opacity: 0.5;
        background: #e6f7ff;
      }

      .sortable-chosen {
        background: #e6f7ff;
      }
    }
  }
}
</style>
