<template>
  <div class="output-manager">
    <contextHolder />
    <a-card class="header">
      <div class="collapse-row">
        <a-button class="btn" type="primary" @click="onAdd">新增 Mock 接口</a-button>
        <a-button class="btn filter-toggle" @click="searchCollapsed = !searchCollapsed">
          <FilterOutlined />
          筛选{{ activeFilterCount > 0 ? ` (${activeFilterCount})` : '' }}
          <DownOutlined class="toggle-icon" :class="{ 'toggle-icon--up': !searchCollapsed }" />
        </a-button>
      </div>
      <div v-show="!searchCollapsed" class="search-area">
        <div class="search-options">
          <a-checkbox v-model:checked="autoCollapseAfterSearch">查询后自动收起</a-checkbox>
        </div>
        <div class="search-bar">
          <SearchForm
            :columns="searchFormColumns"
            :init-form-values="initSearchForm"
            :process-before-submit="processBeforeSearchFormSubmit"
            :form-item-col="searchFormItemColRef"
            :form-props="searchFormFormProps"
            @submit="onSearchSubmit"
          />
        </div>
        <div class="tool-bar">
          <div class="btn-group">
            <a-button class="btn" danger :loading="batchDeleteLoading" @click="onBatchDelete">
              批量删除
            </a-button>
          </div>
        </div>
      </div>
    </a-card>
    <a-card v-dom-resize="onResize" class="content">
      <Spin>
        <a-table
          :columns="tableColumns"
          :data-source="tableData"
          :pagination="false"
          :loading="tableLoading"
          row-key="id"
          :scroll="{ x: 1200, y: tableHeight }"
        >
          <template #bodyCell="{ text, column, record, index }">
            <template v-if="column.key === 'index'">
              {{ getRowIndex(index) }}
            </template>

            <template v-else-if="column.key === 'url'">
              <template v-if="text">
                <span class="url-text">{{ text }}</span>
                <CopyIcon :text="text" :tooltip="true" />
              </template>
              <template v-else>-</template>
            </template>

            <template v-else-if="column.key === 'params'">
              <div class="params">{{ record.params }}</div>
            </template>

            <template v-else-if="column.key === 'enabled'">
              <a-tag :color="record.enabled ? 'green' : 'red'">
                {{ record.enabled ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'operation'">
              <div class="operation">
                <a-button type="link" @click="onDetail(record)">查看详情</a-button>

                <a-popconfirm title="确认复制？" @confirm="onCopy(record)">
                  <a-button type="link">复制</a-button>
                </a-popconfirm>

                <a-button type="link" @click="onEdit(record)">编辑</a-button>

                <a-button type="link" @click="onEditVariants(record)">响应变体</a-button>

                <a-button type="link" @click="onCopyIntoGroup(record)">拷入测试组</a-button>

                <a-popconfirm
                  :title="record.enabled ? '确认禁用？' : '确认启用？'"
                  @confirm="onToggleEnabled(record)"
                >
                  <a-button :danger="record.enabled" type="link">
                    {{ record.enabled ? '禁用' : '启用' }}
                  </a-button>
                </a-popconfirm>

                <a-popconfirm title="确认删除？" @confirm="onDelete(record)">
                  <a-button danger type="link">删除</a-button>
                </a-popconfirm>
              </div>
            </template>

            <template v-else-if="typeof column.formatter === 'function'">
              {{ column.formatter({ text, record }) }}
            </template>
          </template>
        </a-table>

        <div class="pagination">
          <a-pagination
            :total="total"
            :current="pagination.currentPage"
            :page-size="pagination.pageSize"
            :page-size-options="pagination.pageSizes"
            show-size-changer
            show-quick-jumper
            :show-total="(num: number) => `共 ${num} 条`"
            @change="onPageChange"
            @show-size-change="onSizeChange"
          />
        </div>
      </Spin>
    </a-card>

    <UserApiEditorDialog
      ref="userApiEditorDialogRef"
      :loading="editLoading"
      @submit="onUserApiEditorSubmit"
      @close="onUserApiEditorDialogClose"
    />
    <VariantEditorDialog ref="variantEditorDialogRef" @close="onVariantEditorClose" />
    <DetailDialog ref="detailDialogRef" @close="onDetailDialogClose" />
    <GroupPickerDialog
      ref="groupPickerDialogRef"
      :loading="copyIntoLoading"
      @submit="onCopyIntoGroupSubmit"
    />
  </div>
</template>

<script lang="ts" setup name="outputManager">
import { computed, nextTick, reactive, ref } from 'vue';
import { cloneDeep, isPlainObject } from 'lodash-es';
import { message, Modal } from 'ant-design-vue';
import { DownOutlined, FilterOutlined } from '@ant-design/icons-vue';
import { generateUUID } from '@/utils';
import SearchForm from '@/components/form/SearchForm/index.vue';
import Spin from '@/components/Spin/index.vue';
import CopyIcon from '@/components/CopyIcon/index.vue';
import DetailDialog from '@apps/dataManager/components/DetailDialog/index.vue';
import UserApiEditorDialog from '@apps/dataManager/components/UserApiEditorDialog/index.vue';
import VariantEditorDialog from '@apps/dataManager/components/VariantEditorDialog/index.vue';
import GroupPickerDialog from '@apps/dataManager/components/GroupPickerDialog/index.vue';
import {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initSearchForm,
  searchFormColumns,
  tableColumns,
  searchFormFormProps,
  processBeforeSearchFormSubmit,
} from './config';
import type { OutputManagerType } from './type';
import useSearchFormResize from '@/hooks/useSearchFormResize';
import { useDataManagerApi } from '@apps/dataManager/hooks/useDataManagerApi';

const { searchFormItemColRef } = useSearchFormResize();

// 4.x 起 Modal.confirm 等静态方法不消费 ConfigProvider 上下文，
// 改用 useModal 使 confirm 继承 a-config-provider 的 zhCN locale
const [modal, contextHolder] = Modal.useModal();

const {
  getMockDataPage,
  editMockData,
  addMockData,
  deleteMockData,
  batchDeleteMockData,
  copyMockData,
  copyIntoTestGroup,
} = useDataManagerApi({
  onReady: () => {
    nextTick(() => {
      onSearchSubmit(initSearchForm);
    });
  },
});

/** 详情弹窗实例 */
const detailDialogRef = ref<InstanceType<typeof DetailDialog> | null>(null);
/** 编辑弹窗实例 */
const userApiEditorDialogRef = ref<InstanceType<typeof UserApiEditorDialog> | null>(null);
/** 响应变体编辑弹窗实例 */
const variantEditorDialogRef = ref<InstanceType<typeof VariantEditorDialog> | null>(null);
/** 拷入测试组弹窗实例 */
const groupPickerDialogRef = ref<InstanceType<typeof GroupPickerDialog> | null>(null);
/** 当前操作行数据 */
const curRow = ref<OutputManagerType.RowRecord>({});

/** 当前查询表单值 */
const searchForm = ref<OutputManagerType.SearchForm>({});
/** 搜索区折叠态：默认收起（9 字段占高过大），v-show 保留表单状态 */
const searchCollapsed = ref<boolean>(true);
/** 查询/重置后是否自动收起筛选浮层：勾选态仅内存级，弹窗重开还原默认 */
const autoCollapseAfterSearch = ref<boolean>(true);
/** 已生效筛选项数（提交态），>0 时 toggle 按钮带计数提示 */
const activeFilterCount = computed((): number => {
  return Object.values(searchForm.value).filter(v => v != null && v !== '').length;
});
/** 表格数据（来自 Qt 分页请求） */
const tableData = ref<OutputManagerType.RowRecord[]>([]);
/** 当前过滤结果总数 */
const total = ref<number>(0);
/** 表格可视高度（单位 px） */
const tableHeight = ref<number>(defaultTableHeight);

/** 分页状态 */
const pagination = reactive(cloneDeep(initPagination));

/** 各操作 loading 状态 */
const loadingMap = reactive<Record<string, boolean>>({
  get_mock_data_page: false,
  edit_mock_data: false,
  add_mock_data: false,
  delete_mock_data: false,
  batch_delete_mock_data: false,
  copy_mock_data: false,
  copy_into_test_group: false,
});

/** 各请求的最新 token，用于竞态过滤 */
const requestTokenMap = reactive<Record<string, string>>({});

/** 表格级 loading（拉取/删除动作） */
const tableLoading = computed((): boolean => {
  return loadingMap.get_mock_data_page || loadingMap.delete_mock_data;
});

/** 编辑弹窗级 loading（新增/编辑动作） */
const editLoading = computed((): boolean => {
  return loadingMap.edit_mock_data || loadingMap.add_mock_data;
});

/** 批量删除 loading */
const batchDeleteLoading = computed((): boolean => loadingMap.batch_delete_mock_data);

/** 拷入测试组 loading */
const copyIntoLoading = computed((): boolean => loadingMap.copy_into_test_group);

/**
 * 分页拉取接口数据。
 * @param pageNum 当前页码
 * @param pageSize 每页大小
 */
const getDataSource = (pageNum: number, pageSize: number): void => {
  const token = generateUUID();
  requestTokenMap.get_mock_data_page = token;
  loadingMap.get_mock_data_page = true;

  getMockDataPage({
    ...searchForm.value,
    page_num: pageNum,
    page_size: pageSize,
  })
    .then(res => {
      // 竞态过滤：非最新 token 的响应直接丢弃
      if (requestTokenMap.get_mock_data_page !== token) return;

      const receiveData = isPlainObject(res) ? res : {};
      const {
        list = [],
        page_num: resPageNum = pageNum,
        page_size: resPageSize = pageSize,
        total: resTotal = 0,
      } = receiveData;

      tableData.value = Array.isArray(list) ? list : [];
      pagination.currentPage = resPageNum;
      pagination.pageSize = resPageSize;
      total.value = resTotal;
    })
    .finally(() => {
      if (requestTokenMap.get_mock_data_page === token) {
        loadingMap.get_mock_data_page = false;
      }
    });
};

/**
 * 拉取接口数据。
 * @param refresh 是否重置到第一页
 */
const fetchData = (refresh: boolean = false): void => {
  const pageNum = refresh ? 1 : pagination.currentPage;
  getDataSource(pageNum, pagination.pageSize);
};

/**
 * 计算当前页序号。
 * @param index 当前页下标
 */
const getRowIndex = (index: number): number => {
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  return startIndex + index + 1;
};

/**
 * 分页大小变化处理。
 * @param current 当前页码
 * @param pageSize 每页大小
 */
const onSizeChange = (current: number, pageSize: number): void => {
  pagination.currentPage = current;
  pagination.pageSize = pageSize;
  getDataSource(current, pageSize);
};

/**
 * 页码变化处理。
 * @param page 目标页码
 * @param pageSize 每页大小
 */
const onPageChange = (page: number, pageSize: number): void => {
  pagination.currentPage = page;
  pagination.pageSize = pageSize;
  getDataSource(page, pageSize);
};

/**
 * 搜索表单提交。
 * @param form 搜索表单值
 */
const onSearchSubmit = (form: OutputManagerType.SearchForm = {}): void => {
  searchForm.value = cloneDeep(form);
  // SearchForm 的「重置」与「查询」共用 submit 出口，此处一处门控同时覆盖
  if (autoCollapseAfterSearch.value) {
    searchCollapsed.value = true; // 提交即收起悬浮层看结果
  }
  fetchData(true);
};

/**
 * 容器尺寸变化回调，用于重算表格高度。
 * @param entry ResizeObserverEntry
 */
const onResize = (entry: ResizeObserverEntry): void => {
  if (!entry?.target) {
    return;
  }

  const { height } = entry.target.getBoundingClientRect();
  tableHeight.value = Math.max(tableMinHeight, height - tableHeightOffset);
};

/** 新增按钮点击 */
const onAdd = (): void => {
  curRow.value = {};
  // 新增时默认 USER 类型
  userApiEditorDialogRef.value?.show?.({ isEdit: false });
};

/**
 * 查看详情按钮点击。
 * @param record 行数据
 */
const onDetail = (record: OutputManagerType.RowRecord = {}): void => {
  detailDialogRef.value?.show?.(record.id);
};

/** 详情弹窗关闭回调 */
const onDetailDialogClose = (): void => {
  curRow.value = {};
};

/**
 * 响应变体按钮点击。
 * @param record 行数据
 */
const onEditVariants = (record: OutputManagerType.RowRecord = {}): void => {
  variantEditorDialogRef.value?.show?.({
    apiDataId: record.id,
  });
};

/** 响应变体弹窗关闭回调 */
const onVariantEditorClose = (): void => {
  // 关闭后刷新列表，变体操作可能影响 api_data 的 updated_at
  fetchData(false);
};

/**
 * 编辑按钮点击。
 * @param record 行数据
 */
const onEdit = (record: OutputManagerType.RowRecord = {}): void => {
  curRow.value = cloneDeep(record);
  userApiEditorDialogRef.value?.show?.({
    isEdit: true,
    formData: cloneDeep(record),
    recordType: record.type,
  });
};

/**
 * 编辑提交。
 * @param formData 表单数据
 */
const onEditSubmit = (formData: OutputManagerType.RowRecord = {}): void => {
  const { id = '' } = curRow.value;
  if (!id) {
    message.error('编辑接口数据失败！');
    return;
  }
  const params = { id, ...formData };
  const token = generateUUID();
  requestTokenMap.edit_mock_data = token;
  loadingMap.edit_mock_data = true;
  editMockData(params)
    .then(() => {
      if (requestTokenMap.edit_mock_data !== token) {
        return;
      }
      message.success('更新接口数据成功');
      fetchData(false);
      userApiEditorDialogRef.value?.close?.();
    })
    .finally(() => {
      if (requestTokenMap.edit_mock_data === token) {
        loadingMap.edit_mock_data = false;
      }
    });
};

/**
 * 新增提交。
 * @param formData 表单数据
 */
const onAddSubmit = (formData: OutputManagerType.RowRecord = {}): void => {
  const token = generateUUID();
  requestTokenMap.add_mock_data = token;
  loadingMap.add_mock_data = true;
  addMockData(formData)
    .then(() => {
      if (requestTokenMap.add_mock_data !== token) {
        return;
      }
      message.success('新增接口数据成功');
      fetchData(true);
      userApiEditorDialogRef.value?.close?.();
    })
    .finally(() => {
      if (requestTokenMap.add_mock_data === token) {
        loadingMap.add_mock_data = false;
      }
    });
};

/**
 * 编辑弹窗提交回调。
 * @param payload 提交数据
 */
const onUserApiEditorSubmit = (
  payload: { form?: OutputManagerType.RowRecord; isEdit?: boolean } = {},
): void => {
  const { form = {}, isEdit = true } = payload;
  if (isEdit) {
    onEditSubmit(form);
  } else {
    onAddSubmit(form);
  }
};

/** 编辑弹窗关闭回调 */
const onUserApiEditorDialogClose = (): void => {
  curRow.value = {};
  loadingMap.edit_mock_data = false;
  loadingMap.add_mock_data = false;
};

/**
 * 删除按钮点击。
 * @param record 行数据
 */
const onDelete = (record: OutputManagerType.RowRecord = {}): void => {
  const { id = '' } = record;
  const token = generateUUID();
  requestTokenMap.delete_mock_data = token;
  loadingMap.delete_mock_data = true;
  deleteMockData({ id })
    .then(() => {
      if (requestTokenMap.delete_mock_data !== token) {
        return;
      }
      message.success('删除接口数据成功');
      fetchData(true);
    })
    .finally(() => {
      if (requestTokenMap.delete_mock_data === token) {
        loadingMap.delete_mock_data = false;
      }
    });
};

/**
 * 切换启用状态按钮点击。
 * @param record 行数据
 */
const onToggleEnabled = (record: OutputManagerType.RowRecord = {}): void => {
  const { id = '' } = record;
  if (!id) {
    message.error('切换启用状态失败！');
    return;
  }
  const nextEnabled = !record.enabled;
  editMockData({ id, enabled: nextEnabled }).then(() => {
    message.success(nextEnabled ? '启用成功' : '禁用成功');
    fetchData(false);
  });
};

/**
 * 拷入测试组按钮点击：打开目标组选择弹窗。
 * @param record 行数据
 */
const onCopyIntoGroup = (record: OutputManagerType.RowRecord = {}): void => {
  curRow.value = cloneDeep(record);
  groupPickerDialogRef.value?.show?.();
};

/**
 * 拷入测试组提交：推入语义，条目默认禁用（请到组详情启用）。
 * @param payload 弹窗提交载荷
 */
const onCopyIntoGroupSubmit = (
  payload: { group_id?: string; copy_variants?: boolean } = {},
): void => {
  const { group_id = '', copy_variants = true } = payload;
  const { id = '' } = curRow.value;
  if (!id || !group_id) {
    message.error('拷入测试组失败！');
    return;
  }
  const token = generateUUID();
  requestTokenMap.copy_into_test_group = token;
  loadingMap.copy_into_test_group = true;
  copyIntoTestGroup({ api_id: id, group_id, copy_variants, enabled: false })
    .then(() => {
      if (requestTokenMap.copy_into_test_group !== token) {
        return;
      }
      message.success('已拷入测试组（默认禁用，请到组详情启用）');
      groupPickerDialogRef.value?.close?.();
    })
    .finally(() => {
      if (requestTokenMap.copy_into_test_group === token) {
        loadingMap.copy_into_test_group = false;
      }
    });
};

/** 批量删除按钮点击 */
const onBatchDelete = (): void => {
  modal.confirm({
    title: '批量删除确认',
    content: '确认删除当前筛选条件下的全部 Mock 数据？',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    centered: true,
    onOk: () => {
      const token = generateUUID();
      requestTokenMap.batch_delete_mock_data = token;
      loadingMap.batch_delete_mock_data = true;
      return batchDeleteMockData(searchForm.value)
        .then(res => {
          if (requestTokenMap.batch_delete_mock_data !== token) {
            return;
          }
          const count = res?.affected_count || 0;
          message.success(`批量删除成功，共删除 ${count} 条记录`);
          fetchData(true);
        })
        .finally(() => {
          if (requestTokenMap.batch_delete_mock_data === token) {
            loadingMap.batch_delete_mock_data = false;
          }
        });
    },
  });
};

/**
 * 复制按钮点击。
 * @param record 行数据
 */
const onCopy = (record: OutputManagerType.RowRecord = {}): void => {
  const { type = '' } = searchForm.value;
  const refresh = type !== 'MITMPROXY';

  const params = {
    id: record.id,
  };
  const token = generateUUID();
  requestTokenMap.copy_mock_data = token;
  loadingMap.copy_mock_data = true;
  copyMockData(params)
    .then(() => {
      if (requestTokenMap.copy_mock_data !== token) {
        return;
      }
      message.success('复制接口数据成功');
      if (refresh) {
        fetchData(true);
      }
    })
    .finally(() => {
      if (requestTokenMap.copy_mock_data === token) {
        loadingMap.copy_mock_data = false;
      }
    });
};
</script>

<style scoped lang="scss">
.output-manager {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  flex-direction: column;

  .header {
    width: 100%;
    margin-bottom: 24px;
    flex-shrink: 0;
    position: relative; // 悬浮搜索层锚点（antd card 根不裁切，absolute 子级可溢出卡片边界）

    :deep(.search-form) {
      .form-wrapper {
        scrollbar-gutter: stable;
        max-height: 168px;
        overflow: hidden;
        overflow-y: auto;
      }
    }

    .collapse-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .filter-toggle {
      .toggle-icon {
        font-size: 10px;
        transition: transform 0.2s;
      }

      .toggle-icon--up {
        transform: rotate(180deg);
      }
    }

    // 悬浮层：出文档流不占高，从 header 卡下沿展开盖住表格上部（popover 语义）
    .search-area {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 8px;
      z-index: 10; // 压 content 卡与表格 sticky 表头
      background: $qt-panel-bg;
      border: 1px solid $qt-border-soft;
      border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      padding: 14px 20px;
    }

    // 浮层顶部薄选项行：与 tool-bar 按钮列同侧右对齐
    .search-options {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 14px;
    }

    .search-bar {
      width: 100%;
      margin-bottom: 14px;
    }

    .tool-bar {
      width: 100%;
      display: flex;
      flex-direction: row-reverse;

      .btn-group {
        display: flex;

        .btn {
          &:not(:first-child) {
            margin-left: 14px;
          }
        }
      }
    }
  }

  .content {
    flex: 1;
    overflow: hidden;
    width: 100%;
    height: 100%;

    :deep(.ant-card-body) {
      padding: 14px 20px 0;
      height: 100%;
    }

    .operation {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
    }

    .pagination {
      height: 60px;
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
    }

    .url-text {
      margin-right: 6px;
      word-break: break-all;
    }
  }

  .params {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
</style>
