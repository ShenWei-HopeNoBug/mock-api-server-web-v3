<template>
  <a-modal
    v-model:visible="visible"
    title="响应变体管理"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    :mask-closable="false"
    :keyboard="false"
    :centered="true"
    :destroy-on-close="true"
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
      <div ref="contentRef" class="content" v-dom-resize="onResize">
        <a-table
          row-key="id"
          :columns="currentColumns"
          :data-source="variantList"
          :pagination="false"
          :loading="tableLoading"
          :scroll="{ x: 1000, y: tableHeight }"
        >
          <template #bodyCell="{ column, record }">
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
                  :disabled="isOperating(record.id)"
                  @confirm="onToggleEnabled(record)"
                >
                  <a-button :danger="record.enabled" type="link" :loading="isOperating(record.id)">
                    {{ record.enabled ? '禁用' : '启用' }}
                  </a-button>
                </a-popconfirm>

                <a-popconfirm
                  title="确认复制？"
                  :disabled="isOperating(record.id)"
                  @confirm="onCopy(record)"
                >
                  <a-button type="link" :disabled="isOperating(record.id)">复制</a-button>
                </a-popconfirm>

                <a-button type="link" :disabled="isOperating(record.id)" @click="onEdit(record)">
                  编辑
                </a-button>

                <a-popconfirm
                  title="确认删除？"
                  :disabled="isOperating(record.id)"
                  @confirm="onDelete(record)"
                >
                  <a-button danger type="link" :loading="isOperating(record.id)">删除</a-button>
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
import VariantFormDialog from '@apps/dataManager/views/outputManager/components/VariantFormDialog/index.vue';
import type { VariantEditorDialogType } from './type';
import { variantTableColumns } from '@apps/dataManager/views/outputManager/components/VariantFormDialog/config';
import { useOutputManagerApi } from '@apps/dataManager/views/outputManager/hooks/useOutputManagerApi';
import { generateUUID } from '@/utils';
import { cloneDeep } from 'lodash-es';

/** 弹窗关闭事件 */
const emits = defineEmits<{
  (e: 'close'): void;
}>();

/** 接口数据相关 API */
const { getMockDataDetail, updateVariant, deleteVariant, reorderVariants, copyVariant } =
  useOutputManagerApi();

const visible = ref<boolean>(false); // 弹窗显隐
const tableLoading = ref<boolean>(false); // 表格加载态
const variantList = ref<VariantEditorDialogType.VariantRecord[]>([]); // 变体列表数据
const apiDataId = ref<string>(''); // 当前接口数据 ID

const variantFormDialogRef = ref<InstanceType<typeof VariantFormDialog> | null>(null); // 新增/编辑表单弹窗引用
const contentRef = ref<HTMLElement | null>(null); // 内容区容器引用，用于 Sortable 绑定
const tableHeight = ref<number>(400); // 表格滚动区域高度
/** 请求竞态令牌，仅最后一次请求的 token 匹配时才更新数据 */
const currentRequestToken = ref<string>(generateUUID());
/** 记录正在操作中的变体 id，防止同一条记录并发操作 */
const operatingIds = ref<Record<string, boolean>>({});

/** 判断指定变体是否正在操作中 */
const isOperating = (id: string): boolean => !!operatingIds.value[id];

// --- 拖拽排序相关状态 ---
let sortableInstance: Sortable | null = null;
const isSortMode = ref<boolean>(false);
const isSavingSort = ref<boolean>(false);
const hasOrderChanged = ref<boolean>(false);
/** 进入排序模式时记录的原始 id 顺序，用于比较是否有变化 */
const originalVariantIds = ref<string[]>([]);
/** 排序保存请求竞态令牌 */
const sortRequestToken = ref<string>(generateUUID());

/** 排序模式下隐藏操作列 */
const currentColumns = computed(() => {
  if (isSortMode.value) {
    return variantTableColumns.filter(col => col.key !== 'operation');
  }
  return variantTableColumns;
});

/**
 * 重新加载变体列表数据
 * 先清空再在 nextTick 中赋值，强制触发表格重渲染（拖拽排序后需重建 DOM）
 */
const reloadList = (arr: VariantEditorDialogType.VariantRecord[] = []) => {
  variantList.value = [];
  nextTick(() => {
    variantList.value = arr;
  });
};

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

/** 拉取当前接口的变体列表，通过 token 防竞态 */
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

/** 销毁 Sortable 实例 */
const destroySortable = (): void => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
};

/** 初始化 Sortable 实例，绑定到表格 tbody */
const initSortable = (): void => {
  // 仅在 content 容器内查询，避免全局选择器误匹配其他实例
  const tableBody = contentRef.value?.querySelector('.ant-table-tbody');
  if (!tableBody) {
    return;
  }

  // antd 表格会在 tbody 内渲染 .ant-table-measure-row 用于列宽测量，
  // 该行不是 .ant-table-row 但仍会被 Sortable 计入索引，导致 oldIndex/newIndex 偏移。
  // 动态计算第一个 .ant-table-row 之前的非数据行数量作为偏移量。
  const getRowIndexOffset = (): number => {
    const children = Array.from(tableBody.children);
    const firstRowIdx = children.findIndex(el => el.classList.contains('ant-table-row'));
    return firstRowIdx === -1 ? 0 : firstRowIdx;
  };

  sortableInstance = Sortable.create(tableBody as HTMLElement, {
    animation: 200,
    handle: '.drag-handle--active',
    draggable: '> .ant-table-row',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    // 表格配置了 scroll.y，tbody 处于独立滚动容器内，开启自动滚屏
    scroll: true,
    bubbleScroll: true,
    onEnd: ({ oldIndex, newIndex }) => {
      if (oldIndex === undefined || newIndex === undefined) {
        return;
      }
      const offset = getRowIndexOffset();
      const oi = oldIndex - offset;
      const ni = newIndex - offset;
      if (oi === ni || oi < 0 || ni < 0) {
        return;
      }
      const arr = cloneDeep(variantList.value);
      const oldValue = arr[oi];
      if (!oldValue) {
        return;
      }
      arr.splice(oi, 1);
      arr.splice(ni, 0, oldValue);
      checkOrderChanged(arr);
      reloadList(arr);
    },
  });
};

/** 比较当前顺序与原始顺序，更新 hasOrderChanged */
const checkOrderChanged = (arr: VariantEditorDialogType.VariantRecord[] = []): void => {
  const currentIds = arr.map(v => v.id!);
  hasOrderChanged.value = currentIds.some((id, i) => id !== originalVariantIds.value[i]);
};

/** 切换拖拽排序模式 */
const toggleSortMode = (): void => {
  if (isSortMode.value) {
    destroySortable();
    isSortMode.value = false;
    hasOrderChanged.value = false;
    const originalList = originalVariantIds.value
      .map(id => variantList.value.find(v => v.id === id))
      .filter(Boolean) as VariantEditorDialogType.VariantRecord[];
    reloadList(originalList);
    return;
  }
  isSortMode.value = true;
  hasOrderChanged.value = false;
  originalVariantIds.value = variantList.value.map(v => v.id!);
  nextTick(() => {
    initSortable();
  });
};

/** 保存排序结果到服务端 */
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

/** 重置所有内部状态 */
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
  operatingIds.value = {};
};

/** 打开弹窗并加载变体数据 */
const show = (options: VariantEditorDialogType.ShowOptions = {}): void => {
  resetStates();
  apiDataId.value = options.apiDataId || '';
  visible.value = true;
  nextTick(() => {
    fetchVariants();
  });
};

/** 关闭弹窗并重置状态 */
const close = (): void => {
  visible.value = false;
  resetStates();
  variantFormDialogRef.value?.close?.();
  emits('close');
};

// --- 新增/编辑表单弹窗 ---

/** 打开新增变体表单 */
const onAdd = (): void => {
  variantFormDialogRef.value?.show?.({ isEdit: false });
};

/** 打开编辑变体表单 */
const onEdit = (record: VariantEditorDialogType.VariantRecord): void => {
  variantFormDialogRef.value?.show?.({ isEdit: true, record });
};

// --- 启用/禁用切换 ---

/** 切换变体启用状态，防重复点击 */
const onToggleEnabled = (record: VariantEditorDialogType.VariantRecord): void => {
  const id: string = record.id || '';
  if (isOperating(id)) {
    return;
  }
  operatingIds.value[id] = true;
  const nextEnabled = !record.enabled;
  updateVariant({ id, enabled: nextEnabled })
    .then(res => {
      if (res) {
        message.success(nextEnabled ? '启用成功' : '禁用成功');
        fetchVariants();
      } else {
        message.error('切换启用状态失败');
      }
    })
    .catch(() => {
      message.error('切换启用状态失败');
    })
    .finally(() => {
      operatingIds.value[id] = false;
    });
};

// --- 复制 ---

/** 复制指定变体，防重复点击 */
const onCopy = (record: VariantEditorDialogType.VariantRecord): void => {
  const id: string = record.id || '';
  if (isOperating(id) || !apiDataId.value) {
    return;
  }
  operatingIds.value[id] = true;
  copyVariant({ id, api_data_id: apiDataId.value })
    .then(res => {
      if (res) {
        message.success('复制变体成功');
        fetchVariants();
      } else {
        message.error('复制变体失败');
      }
    })
    .catch(() => {
      message.error('复制变体失败');
    })
    .finally(() => {
      operatingIds.value[id] = false;
    });
};

// --- 删除 ---

/** 删除指定变体，防重复点击 */
const onDelete = (record: VariantEditorDialogType.VariantRecord): void => {
  const id: string = record.id || '';
  if (isOperating(id)) {
    return;
  }
  operatingIds.value[id] = true;
  deleteVariant({ id })
    .then(res => {
      if (res) {
        message.success('删除变体成功');
        fetchVariants();
      } else {
        message.error('删除变体失败');
      }
    })
    .catch(() => {
      message.error('删除变体失败');
    })
    .finally(() => {
      operatingIds.value[id] = false;
    });
};

// 组件卸载前清理 Sortable 实例，避免内存泄漏
onBeforeUnmount(() => {
  destroySortable();
});

/** 暴露弹窗打开/关闭方法供父组件调用 */
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
