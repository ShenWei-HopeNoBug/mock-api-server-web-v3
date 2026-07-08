<template>
  <Spin :spinning="pageLoading" tip="修复异常接口数据中...">
    <div class="output-manager">
      <a-card class="header">
        <div class="search-bar">
          <SearchForm
            :columns="searchFormColumns"
            :init-form-values="initSearchForm"
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
        <Spin :spinning="tableLoading" tip="接口数据加载中...">
          <a-table
            :columns="tableColumns"
            :data-source="paginationTableData"
            :pagination="false"
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
  </Spin>
</template>

<script lang="ts" setup name="outputManager">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { cloneDeep, isObject } from 'lodash-es';
import { message, Modal } from 'ant-design-vue';
import { useQtBridgeStore } from '@apps/dataManager/store/useQtBridge';
import QtBridge from '@/utils/bridge/QtBridge';
import { isBridgeUsable } from '@/utils/bridge/tools';
import SearchForm from '@/components/form/SearchForm/index.vue';
import Spin from '@/components/Spin/index.vue';
import DetailDialog from './components/DetailDialog/index.vue';
import UserApiEditorDialog from './components/UserApiEditorDialog/index.vue';
import {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initActionIdMap,
  initSearchForm,
  searchFormColumns,
  tableColumns,
} from './config';
import type { OutputManagerType } from './type';
import { isJsonString, generateUUID } from '@/utils';

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
/** 全量数据源（来自 Qt 请求） */
const dataSource = ref<OutputManagerType.RowRecord[]>([]);
/** 过滤后的表格数据 */
const tableData = ref<OutputManagerType.RowRecord[]>([]);
/** 当前过滤结果总数 */
const total = ref<number>(0);
/** 表格可视高度（单位 px） */
const tableHeight = ref<number>(defaultTableHeight);
/** QtBridge 实例引用 */
const bridgeRef = ref<QtBridge | null>(null);

/** 分页状态 */
const pagination = reactive(cloneDeep(initPagination));

/** 请求 action_id 映射（用于响应匹配） */
const actionIdMap = reactive<Record<string, string>>(cloneDeep(initActionIdMap));

/** 当前页表格切片数据 */
const paginationTableData = computed((): OutputManagerType.RowRecord[] => {
  if (!total.value) {
    return [];
  }

  const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
  const endIndex = pagination.currentPage * pagination.pageSize;
  return tableData.value.slice(startIndex, endIndex);
});

/** 页面级 loading（修复动作） */
const pageLoading = computed((): boolean => Boolean(actionIdMap.fix_mock_data));

/** 表格级 loading（拉取/删除动作） */
const tableLoading = computed((): boolean => {
  const { get_mock_data = '', delete_mock_data = '' } = actionIdMap;
  return Boolean(get_mock_data || delete_mock_data);
});

/** 编辑弹窗级 loading（新增/编辑动作） */
const editLoading = computed((): boolean => {
  const { edit_mock_data = '', add_mock_data = '' } = actionIdMap;
  return Boolean(edit_mock_data || add_mock_data);
});

/**
 * 发送请求消息到 Qt。
 * @param options 请求参数
 */
const sendRequestMessage = (options: {
  data?: Record<string, any>;
  name?: OutputManagerType.ActionName;
  extra?: Record<string, any>;
}): void => {
  if (!bridgeRef.value?.isRegister()) {
    return;
  }

  const { data = {}, name, extra = {} } = options;
  if (!name) {
    return;
  }

  const action_id = generateUUID();
  actionIdMap[name] = action_id;

  bridgeRef.value.sendObjMsg({
    params: {},
    ...data,
    type: 'request',
    name,
    action_id,
    extra,
  });
};

/**
 * 拉取接口数据源。
 * @param refresh 是否重置页码
 * @param params 请求参数
 */
const getDataSource = (refresh: boolean = true, params: Record<string, any> = {}): void => {
  if (!bridgeRef.value?.isRegister()) {
    return;
  }

  sendRequestMessage({
    name: 'get_mock_data',
    data: { params },
    extra: { refresh },
  });
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
  onSearch();
};

/**
 * 页码变化处理。
 * @param page 目标页码
 * @param pageSize 每页大小
 */
const onPageChange = (page: number, pageSize: number): void => {
  pagination.currentPage = page;
  pagination.pageSize = pageSize;
  onSearch();
};

/**
 * 按搜索条件执行本地过滤。
 */
const onSearch = (): void => {
  const keyList = searchFormColumns.map(item => item.key);
  const matchList: { key: string; regexp: RegExp }[] = [];

  keyList.forEach(key => {
    const value = searchForm.value[key];
    if (!value) {
      return;
    }

    try {
      const regexp = new RegExp(`${value}`, 'i');
      matchList.push({ key, regexp });
    } catch {
      // noop
    }
  });

  const isMatch = (record: OutputManagerType.RowRecord = {}): boolean => {
    for (let i = 0; i < matchList.length; i++) {
      const { key, regexp } = matchList[i];
      const value = String(record[key]);
      if (!regexp.test(value)) {
        return false;
      }
    }

    return true;
  };

  tableData.value = dataSource.value.filter(item => isMatch(item));
  total.value = tableData.value.length;
};

/**
 * 搜索表单提交。
 * `type` 变化时会重新请求数据，否则仅本地过滤。
 * @param form 搜索表单值
 */
const onSearchSubmit = (form: OutputManagerType.SearchForm = {}): void => {
  const { type: oldType = '' } = searchForm.value;
  const { type: newType = '' } = form;
  searchForm.value = cloneDeep(form);

  if (oldType !== newType) {
    getDataSource(true, { type: newType });
    return;
  }

  pagination.currentPage = 1;
  onSearch();
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

/** 触发修复异常接口数据请求 */
const onFixMockData = (): void => {
  sendRequestMessage({
    name: 'fix_mock_data',
  });
};

/**
 * 校验接口数据是否可用于编辑/删除。
 * 缺少 id 时会弹框引导执行修复。
 * @param record 行数据
 */
const checkApiDataValid = (record: OutputManagerType.RowRecord = {}): boolean => {
  const { id = '' } = record;
  const valid = Boolean(id);
  if (!valid) {
    Modal.confirm({
      title: '确认',
      content: '检测到接口数据异常，是否修复？',
      onOk: () => {
        onFixMockData();
      },
    });
  }

  return valid;
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
  if (!checkApiDataValid(record)) {
    return;
  }

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

  const params = { id, ...formData };
  sendRequestMessage({
    name: 'edit_mock_data',
    data: { params },
  });
};

/**
 * 新增提交。
 * @param formData 表单数据
 */
const onAddSubmit = (formData: OutputManagerType.RowRecord = {}): void => {
  sendRequestMessage({
    name: 'add_mock_data',
    data: { params: formData },
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
  actionIdMap.edit_mock_data = '';
  actionIdMap.add_mock_data = '';
};

/**
 * 删除按钮点击。
 * @param record 行数据
 */
const onDelete = (record: OutputManagerType.RowRecord = {}): void => {
  if (!checkApiDataValid(record)) {
    return;
  }

  const { id = '' } = record;
  sendRequestMessage({
    name: 'delete_mock_data',
    data: { params: { id } },
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
    ...record,
    id: '',
    type: 'USER',
  };

  sendRequestMessage({
    name: 'copy_mock_data',
    data: { params },
    extra: { refresh },
  });
};

/**
 * 处理请求类型响应事件。
 * @param eventData 事件数据
 */
const onRequestEvent = (eventData: OutputManagerType.RequestEvent = {}): void => {
  const { type = '', name = '', data = {}, action_id = '', extra = {} } = eventData;
  if (type !== 'request') {
    return;
  }

  if (!actionIdMap[name]) {
    return;
  }

  if (!action_id || action_id !== actionIdMap[name]) {
    return;
  }

  switch (name) {
    case 'get_mock_data': {
      const receiveData = isObject(data) ? data : {};
      const { list = [] } = receiveData;
      dataSource.value = Array.isArray(list) ? list : [];
      const { refresh = true } = extra;
      if (refresh) {
        pagination.currentPage = 1;
      }

      onSearch();
      break;
    }
    case 'fix_mock_data': {
      if (data) {
        message.success('修复异常接口数据成功');
      } else {
        message.error('修复异常接口数据失败');
      }

      getDataSource(true);
      break;
    }
    case 'edit_mock_data': {
      if (data) {
        message.success('更新接口数据成功');
        getDataSource(false);
        userApiEditorDialogRef.value?.close?.();
      } else {
        message.error('更新接口数据失败');
      }

      break;
    }
    case 'add_mock_data': {
      if (data) {
        message.success('新增接口数据成功');
        getDataSource(true);
        userApiEditorDialogRef.value?.close?.();
      } else {
        message.error('新增接口数据失败');
      }

      break;
    }
    case 'delete_mock_data': {
      if (data) {
        message.success('删除接口数据成功');
        getDataSource(true);
      } else {
        message.error('删除接口数据失败');
      }

      break;
    }
    case 'copy_mock_data': {
      if (data) {
        message.success('复制接口数据成功');
        const { refresh = true } = extra;
        if (refresh) {
          getDataSource(refresh);
        }
      } else {
        message.error('复制接口数据失败');
      }

      break;
    }
    default:
  }

  // 清除对应的 action_id
  if (actionIdMap[name]) {
    actionIdMap[name] = '';
  }
};

/**
 * Qt receive 事件回调。
 * @param messageStr Qt 下发消息
 */
const onReceive = (messageStr: string = ''): void => {
  const eventData = isJsonString(messageStr) ? JSON.parse(messageStr) : {};
  const { type = '' } = eventData;
  if (type === 'request') {
    onRequestEvent(eventData);
  }
};

/** 销毁 bridge 订阅与实例 */
const destroyBridge = (): void => {
  bridgeRef.value?.unsubscribe('receive', onReceive);
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
  bridge.subscribe('receive', onReceive);
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
