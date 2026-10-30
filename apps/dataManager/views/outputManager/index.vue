<template>
  <div class="output-manager">
    <a-card class="header">
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
          <a-button class="btn" type="primary" @click="onAdd">新增 Mock 接口</a-button>
          <a-button class="btn" danger :loading="batchDeleteLoading" @click="onBatchDelete">
            批量删除
          </a-button>
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
  </div>
</template>

<script lang="ts" setup name="outputManager">
import { computed, nextTick, reactive, ref } from 'vue';
import { cloneDeep, isPlainObject } from 'lodash-es';
import { message, Modal } from 'ant-design-vue';
import { generateUUID } from '@/utils';
import SearchForm from '@/components/form/SearchForm/index.vue';
import Spin from '@/components/Spin/index.vue';
import CopyIcon from '@/components/CopyIcon/index.vue';
import DetailDialog from './components/DetailDialog/index.vue';
import UserApiEditorDialog from './components/UserApiEditorDialog/index.vue';
import VariantEditorDialog from './components/VariantEditorDialog/index.vue';
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
import { useOutputManagerApi } from './hooks/useOutputManagerApi';

const { searchFormItemColRef } = useSearchFormResize();

const {
  getMockDataPage,
  editMockData,
  addMockData,
  deleteMockData,
  batchDeleteMockData,
  copyMockData,
} = useOutputManagerApi({
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
/** 当前操作行数据 */
const curRow = ref<OutputManagerType.RowRecord>({});

/** 当前查询表单值 */
const searchForm = ref<OutputManagerType.SearchForm>({});
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

/** 批量删除按钮点击 */
const onBatchDelete = (): void => {
  Modal.confirm({
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

    :deep(.search-form) {
      .form-wrapper {
        scrollbar-gutter: stable;
        max-height: 168px;
        overflow: hidden;
        overflow-y: auto;
      }
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
