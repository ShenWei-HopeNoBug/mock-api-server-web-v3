<template>
  <div class="output-manager">
    <a-card class="header">
      <div class="search-bar">
        <SearchForm
          :columns="searchFormColumns"
          :init-form-values="initSearchForm"
          :process-before-submit="processBeforeSearchFormSubmit"
          :form-item-col="searchFormItemColRef"
          @submit="onSearchSubmit"
        />
      </div>
      <div class="tool-bar">
        <div class="btn-group">
          <a-button type="primary" @click="onAdd">新增 Mock 接口</a-button>
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
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ getRowIndex(index) }}
            </template>

            <template v-else-if="column.key === 'params'">
              <div class="params">{{ record.params }}</div>
            </template>

            <template v-else-if="column.key === 'operation'">
              <div class="operation">
                <a-button type="link" @click="onDetail(record)">查看详情</a-button>

                <a-popconfirm title="确认复制？" @confirm="onCopy(record)">
                  <a-button type="link">复制</a-button>
                </a-popconfirm>

                <template v-if="record.type === 'USER'">
                  <a-button type="link" @click="onEdit(record)">编辑</a-button>

                  <a-popconfirm title="确认删除？" @confirm="onDelete(record)">
                    <a-button danger type="link">删除</a-button>
                  </a-popconfirm>
                </template>
              </div>
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
            @showSizeChange="onSizeChange"
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
    <DetailDialog ref="detailDialogRef" :data-source="curRow" @close="onDetailDialogClose" />
  </div>
</template>

<script lang="ts" setup name="outputManager">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { cloneDeep, isObject } from 'lodash-es';
import { message } from 'ant-design-vue';
import { useQtBridgeStore } from '@apps/dataManager/store/useQtBridge';
import QtBridge from '@/utils/bridge/QtBridge';
import QtRequestManager from '@/utils/bridge/QtRequestManager';
import { setupDefaultInterceptors } from '@/utils/bridge/defaultInterceptors';
import { isBridgeUsable } from '@/utils/bridge/tools';
import { generateUUID } from '@/utils';
import SearchForm from '@/components/form/SearchForm/index.vue';
import Spin from '@/components/Spin/index.vue';
import DetailDialog from './components/DetailDialog/index.vue';
import UserApiEditorDialog from './components/UserApiEditorDialog/index.vue';
import {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initSearchForm,
  searchFormColumns,
  tableColumns,
  processBeforeSearchFormSubmit,
} from './config';
import type { OutputManagerType } from './type';
import useSearchFormResize from '@/hooks/useSearchFormResize';

const { searchFormItemColRef } = useSearchFormResize();

/** Qt 桥接 store 实例 */
const qtBridgeStore = useQtBridgeStore();
/** 详情弹窗实例 */
const detailDialogRef = ref<InstanceType<typeof DetailDialog> | null>(null);
/** 编辑弹窗实例 */
const userApiEditorDialogRef = ref<InstanceType<typeof UserApiEditorDialog> | null>(null);
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
/** QtBridge 实例引用 */
const bridgeRef = ref<QtBridge | null>(null);
/** QtRequestManager 实例引用 */
let requestManager: QtRequestManager | null = null;

/** 分页状态 */
const pagination = reactive(cloneDeep(initPagination));

/** 各操作 loading 状态 */
const loadingMap = reactive<Record<string, boolean>>({
  get_mock_data_page: false,
  edit_mock_data: false,
  add_mock_data: false,
  delete_mock_data: false,
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

/**
 * 分页拉取接口数据。
 * @param pageNum 当前页码
 * @param pageSize 每页大小
 */
const getDataSource = (pageNum: number, pageSize: number): void => {
  if (!requestManager) {
    return;
  }

  const token = generateUUID();
  requestTokenMap.get_mock_data_page = token;
  loadingMap.get_mock_data_page = true;

  requestManager
    .request({
      name: 'get_mock_data_page',
      params: {
        ...searchForm.value,
        page_num: pageNum,
        page_size: pageSize,
      },
    })
    .then(res => {
      // 竞态过滤：非最新 token 的响应直接丢弃
      if (requestTokenMap.get_mock_data_page !== token) return;

      const receiveData = isObject(res.data) ? res.data : {};
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
  userApiEditorDialogRef.value?.show?.({ isEdit: false });
};

/**
 * 查看详情按钮点击。
 * @param record 行数据
 */
const onDetail = (record: OutputManagerType.RowRecord = {}): void => {
  curRow.value = cloneDeep(record);
  detailDialogRef.value?.show?.();
};

/** 详情弹窗关闭回调 */
const onDetailDialogClose = (): void => {
  curRow.value = {};
};

/**
 * 编辑按钮点击。
 * @param record 行数据
 */
const onEdit = (record: OutputManagerType.RowRecord = {}): void => {
  curRow.value = cloneDeep(record);
  userApiEditorDialogRef.value?.show?.({ isEdit: true, formData: cloneDeep(record) });
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
  if (!requestManager) {
    return;
  }

  const params = { id, ...formData };
  const token = generateUUID();
  requestTokenMap.edit_mock_data = token;
  loadingMap.edit_mock_data = true;
  requestManager
    .request({
      name: 'edit_mock_data',
      params,
    })
    .then(res => {
      if (requestTokenMap.edit_mock_data !== token) return;
      if (res.data) {
        message.success('更新接口数据成功');
        fetchData(false);
        userApiEditorDialogRef.value?.close?.();
      } else {
        message.error('更新接口数据失败');
      }
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
  if (!requestManager) {
    return;
  }
  const token = generateUUID();
  requestTokenMap.add_mock_data = token;
  loadingMap.add_mock_data = true;
  requestManager
    .request({
      name: 'add_mock_data',
      params: formData,
    })
    .then(res => {
      if (requestTokenMap.add_mock_data !== token) return;
      if (res.data) {
        message.success('新增接口数据成功');
        fetchData(true);
        userApiEditorDialogRef.value?.close?.();
      } else {
        message.error('新增接口数据失败');
      }
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
  if (!requestManager) {
    return;
  }
  const token = generateUUID();
  requestTokenMap.delete_mock_data = token;
  loadingMap.delete_mock_data = true;
  requestManager
    .request({
      name: 'delete_mock_data',
      params: { id },
    })
    .then(res => {
      if (requestTokenMap.delete_mock_data !== token) return;
      if (res.data) {
        message.success('删除接口数据成功');
        fetchData(true);
      } else {
        message.error('删除接口数据失败');
      }
    })
    .finally(() => {
      if (requestTokenMap.delete_mock_data === token) {
        loadingMap.delete_mock_data = false;
      }
    });
};

/**
 * 复制按钮点击。
 * @param record 行数据
 */
const onCopy = (record: OutputManagerType.RowRecord = {}): void => {
  if (!requestManager) {
    return;
  }

  const { type = '' } = searchForm.value;
  const refresh = type !== 'MITMPROXY';

  const params = {
    id: record.id,
  };
  const token = generateUUID();
  requestTokenMap.copy_mock_data = token;
  loadingMap.copy_mock_data = true;
  requestManager
    .request({
      name: 'copy_mock_data',
      params,
    })
    .then(res => {
      if (requestTokenMap.copy_mock_data !== token) return;
      if (res.data) {
        message.success('复制接口数据成功');
        if (refresh) {
          fetchData(true);
        }
      } else {
        message.error('复制接口数据失败');
      }
    })
    .finally(() => {
      if (requestTokenMap.copy_mock_data === token) {
        loadingMap.copy_mock_data = false;
      }
    });
};

/** 销毁 requestManager 与 bridge 实例 */
const destroyBridge = (): void => {
  requestManager?.destroy();
  requestManager = null;
  bridgeRef.value?.destroy();
  bridgeRef.value = null;
};

/**
 * 初始化页面通信与首屏数据。
 */
const init = (): void => {
  const { dataManager = null } = qtBridgeStore.channelObj || {};
  if (!isObject(dataManager) || !isBridgeUsable(dataManager)) {
    message.error('dataManager 通信对象获取失败！');
    return;
  }

  destroyBridge();

  const bridge = new QtBridge({ bridge: dataManager });
  requestManager = new QtRequestManager(bridge, { timeout: 10000 });

  setupDefaultInterceptors(requestManager, message.error);

  bridgeRef.value = bridge;

  nextTick(() => {
    onSearchSubmit(initSearchForm);
  });
};

/**
 * 监听 Qt 注册状态，注册完成后执行初始化。
 */
watch(
  () => qtBridgeStore.register,
  bool => {
    if (bool) {
      init();
    }
  },
  { immediate: true },
);

/**
 * 组件卸载时清理 bridge 订阅与实例。
 */
onBeforeUnmount(() => {
  destroyBridge();
});
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

    .search-bar {
      width: 100%;
    }

    .tool-bar {
      width: 100%;
      display: flex;
      flex-direction: row-reverse;

      .btn-group {
        display: flex;
        gap: 14px;
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
      gap: 2px;
    }

    .pagination {
      height: 60px;
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
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
