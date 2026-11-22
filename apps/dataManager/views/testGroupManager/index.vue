<template>
  <div class="test-group-manager">
    <a-card class="header">
      <div class="collapse-row">
        <div class="left-actions">
          <a-button class="btn" type="primary" @click="onAdd">新建测试组</a-button>
          <div class="enabled-info">
            <template v-if="enabledGroup">
              <span class="enabled-label">当前启用：</span>
              <span class="enabled-name">{{ enabledGroup.name || '未命名组' }}</span>
              <span class="enabled-count">（{{ enabledGroup.item_count || 0 }} 条）</span>
            </template>
            <span v-else class="enabled-label enabled-label--none">当前启用：无</span>
            <a-tooltip placement="bottomLeft">
              <template #title>
                <div>启用新组会顶替当前启用组</div>
                <div>启用/停用与组内数据变更，均需重启 mock 服务后生效</div>
              </template>
              <QuestionCircleOutlined class="tip-icon" />
            </a-tooltip>
          </div>
        </div>
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
            :form-item-col="searchFormItemColRef"
            :form-props="searchFormFormProps"
            @submit="onSearchSubmit"
          />
        </div>
      </div>
    </a-card>
    <a-card v-dom-resize="onResize" class="content">
      <Spin>
        <a-table
          :columns="groupTableColumns"
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

            <template v-else-if="column.key === 'name'">
              <span class="group-name">{{ text || '未命名组' }}</span>
            </template>

            <template v-else-if="column.key === 'enabled'">
              <a-switch
                :checked="Boolean(record.enabled)"
                :loading="record.id === togglingId"
                @change="onToggleEnabled(record)"
              />
            </template>

            <template v-else-if="column.key === 'operation'">
              <div class="operation">
                <a-button type="link" @click="onManage(record)">管理接口</a-button>
                <a-button type="link" @click="onRename(record)">重命名</a-button>
                <a-popconfirm
                  title="确认删除？组内全部接口条目与变体将一并删除"
                  @confirm="onDelete(record)"
                >
                  <a-button danger type="link">删除</a-button>
                </a-popconfirm>
              </div>
            </template>
          </template>

          <template #headerCell="{ column }">
            <template v-if="column.key === 'enabled'">
              <span class="enabled-title">
                {{ column.title }}
                <a-tooltip placement="bottomLeft">
                  <template #title>
                    <div>启用新组会顶替当前启用组</div>
                    <div>启用/停用与组内数据变更，均需重启 mock 服务后生效</div>
                  </template>
                  <QuestionCircleOutlined class="tip-icon" />
                </a-tooltip>
              </span>
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

    <ModalForm
      ref="groupFormDialogRef"
      :title="groupFormTitle"
      :columns="groupFormColumns"
      :init-form-values="groupFormInit"
      :loading="formLoading"
      :width="480"
      centered
      @submit="onFormSubmit"
    />
  </div>
</template>

<script lang="ts" setup name="testGroupManager">
import { computed, nextTick, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { DownOutlined, FilterOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import { cloneDeep, isPlainObject } from 'lodash-es';
import { useRouter } from 'vue-router';
import { generateUUID } from '@/utils';
import SearchForm from '@/components/form/SearchForm/index.vue';
import Spin from '@/components/Spin/index.vue';
import ModalForm from '@/components/form/ModalForm/index.vue';
import {
  defaultTableHeight,
  tableHeightOffset,
  tableMinHeight,
  initPagination,
  initSearchForm,
  searchFormColumns,
  searchFormFormProps,
  groupTableColumns,
} from './config';
import type { Form as FormType } from '@/components/form/types';
import type { DataManagerType } from '#/qt/dataManager';
import type { TestGroupManagerType } from './type';
import useSearchFormResize from '@/hooks/useSearchFormResize';
import { useDataManagerApi } from '@apps/dataManager/hooks/useDataManagerApi';

const router = useRouter();

const { searchFormItemColRef } = useSearchFormResize();

const {
  getTestGroupPage,
  getEnabledTestGroup,
  createTestGroup,
  updateTestGroup,
  deleteTestGroup,
  enableTestGroup,
  disableTestGroup,
} = useDataManagerApi({
  onReady: () => {
    nextTick(() => {
      onSearchSubmit(initSearchForm);
    });
  },
});

/** 组表单弹窗实例 */
const groupFormDialogRef = ref<InstanceType<typeof ModalForm> | null>(null);

/** 弹窗入口模式：false=新建 / true=重命名 */
const isEdit = ref<boolean>(false);
/** 编辑态整行数据（新建为空对象） */
const curRow = ref<TestGroupManagerType.GroupRecord>({});
/** 弹窗标题 */
const groupFormTitle = computed<string>(() => (isEdit.value ? '重命名测试组' : '新建测试组'));
/** 弹窗表单初值 */
const groupFormInit = ref<TestGroupManagerType.GroupForm>({});
/** 弹窗表单列 */
const groupFormColumns: FormType.FormItemOptions[] = [
  {
    required: true,
    label: '组名称',
    key: 'name',
    inputType: 'input',
    inputProps: { maxlength: 100, allowClear: true, placeholder: '请输入测试组名称' },
  },
];

/** 当前查询表单值 */
const searchForm = ref<TestGroupManagerType.SearchForm>({});
/** 搜索区折叠态：默认收起，v-show 保留表单状态 */
const searchCollapsed = ref<boolean>(true);
/** 查询/重置后是否自动收起筛选浮层：勾选态仅内存级 */
const autoCollapseAfterSearch = ref<boolean>(true);
/** 已生效筛选项数（提交态），>0 时 toggle 按钮带计数提示 */
const activeFilterCount = computed((): number => {
  return Object.values(searchForm.value).filter(v => v != null && v !== '').length;
});
/** 组列表数据（来自 Qt 分页请求） */
const tableData = ref<TestGroupManagerType.GroupRecord[]>([]);
/** 当前过滤结果总数 */
const total = ref<number>(0);
/** 表格可视高度（单位 px） */
const tableHeight = ref<number>(defaultTableHeight);
/** 分页状态 */
const pagination = reactive(cloneDeep(initPagination));
/** 当前启用组摘要（页头指示，无启用组为 null） */
const enabledGroup = ref<DataManagerType.TestGroupSummary | null>(null);
/** 组表单提交态 */
const formLoading = ref<boolean>(false);
/** 正在切换启用态的组 id（switch 行级 loading） */
const togglingId = ref<string>('');

/** 各操作 loading 状态 */
const loadingMap = reactive<Record<string, boolean>>({
  get_test_group_page: false,
  delete_test_group: false,
});

/** 各请求的最新 token，用于竞态过滤 */
const requestTokenMap = reactive<Record<string, string>>({});

/** 表格级 loading（拉取/删除动作） */
const tableLoading = computed<boolean>(() => {
  return loadingMap.get_test_group_page || loadingMap.delete_test_group;
});

/**
 * 分页拉取组列表，页头启用组指示并行刷新。
 * @param pageNum 当前页码
 * @param pageSize 每页大小
 */
const getDataSource = (pageNum: number, pageSize: number): void => {
  // 启用组指示：独立 token 竞态，不进表格 loading，避免启停切换时闪整表
  const enabledToken = generateUUID();
  requestTokenMap.get_test_group_enabled = enabledToken;
  getEnabledTestGroup().then(res => {
    if (requestTokenMap.get_test_group_enabled !== enabledToken) {
      return;
    }
    enabledGroup.value = isPlainObject(res) ? res : null;
  });

  const token = generateUUID();
  requestTokenMap.get_test_group_page = token;
  loadingMap.get_test_group_page = true;

  getTestGroupPage({
    ...searchForm.value,
    page_num: pageNum,
    page_size: pageSize,
  })
    .then(res => {
      // 竞态过滤：非最新 token 的响应直接丢弃
      if (requestTokenMap.get_test_group_page !== token) {
        return;
      }

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
      if (requestTokenMap.get_test_group_page === token) {
        loadingMap.get_test_group_page = false;
      }
    });
};

/**
 * 拉取组列表。
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
const onSearchSubmit = (form: TestGroupManagerType.SearchForm = {}): void => {
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

/** 新建按钮点击 */
const onAdd = (): void => {
  isEdit.value = false;
  curRow.value = {};
  groupFormInit.value = {};
  groupFormDialogRef.value?.show?.();
};

/**
 * 重命名按钮点击。
 * @param record 行数据
 */
const onRename = (record: TestGroupManagerType.GroupRecord = {}): void => {
  isEdit.value = true;
  curRow.value = cloneDeep(record);
  groupFormInit.value = { name: record.name };
  groupFormDialogRef.value?.show?.();
};

/**
 * 组表单提交（新建/重命名共用出口）。
 * @param form 表单数据
 */
const onFormSubmit = (form: TestGroupManagerType.GroupForm = {}): void => {
  const { id = '' } = curRow.value;
  const { name } = form;
  formLoading.value = true;
  const request = isEdit.value ? updateTestGroup({ id, name }) : createTestGroup({ name });
  request
    .then(() => {
      message.success(isEdit.value ? '重命名成功' : '新建测试组成功');
      groupFormDialogRef.value?.close?.();
      fetchData(!isEdit.value);
    })
    .finally(() => {
      formLoading.value = false;
    });
};

/**
 * 启用开关切换：开启 → 启用该组（原子顶替），关闭 → 停用全部组。
 * @param record 行数据
 */
const onToggleEnabled = (record: TestGroupManagerType.GroupRecord = {}): void => {
  const { id = '' } = record;
  if (!id) {
    return;
  }
  const nextEnabled = !record.enabled;
  togglingId.value = id;
  const request = nextEnabled ? enableTestGroup({ id }) : disableTestGroup();
  request
    .then(() => {
      message.success(
        nextEnabled ? '已启用，重启 mock 服务后生效' : '已停用，重启 mock 服务后生效',
      );
      fetchData(false);
    })
    .finally(() => {
      togglingId.value = '';
    });
};

/**
 * 删除按钮点击。
 * @param record 行数据
 */
const onDelete = (record: TestGroupManagerType.GroupRecord = {}): void => {
  const { id = '' } = record;
  if (!id) {
    return;
  }
  const token = generateUUID();
  requestTokenMap.delete_test_group = token;
  loadingMap.delete_test_group = true;
  deleteTestGroup({ id })
    .then(() => {
      if (requestTokenMap.delete_test_group !== token) {
        return;
      }
      message.success('删除测试组成功');
      fetchData(true);
    })
    .finally(() => {
      if (requestTokenMap.delete_test_group === token) {
        loadingMap.delete_test_group = false;
      }
    });
};

/**
 * 管理接口按钮点击，跳组详情页。
 * @param record 行数据
 */
const onManage = (record: TestGroupManagerType.GroupRecord = {}): void => {
  if (!record.id) {
    return;
  }
  router.push({ name: 'testGroupDetail', params: { id: record.id } });
};
</script>

<style scoped lang="scss">
.test-group-manager {
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

    .left-actions {
      display: flex;
      align-items: center;

      .enabled-info {
        display: flex;
        align-items: center;
        margin-left: 16px;

        .enabled-label {
          color: $qt-text;
          opacity: 0.65;
        }

        .enabled-name {
          color: $qt-link;
          font-weight: 600;
        }

        .enabled-count {
          color: $qt-text;
          opacity: 0.65;
          font-size: 12px;
        }

        .tip-icon {
          margin-left: 6px;
          color: $qt-text;
          opacity: 0.55;
          cursor: help;
        }
      }
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

    .group-name {
      font-weight: 500;
      word-break: break-all;
    }

    .enabled-title {
      display: inline-flex;
      align-items: center;

      .tip-icon {
        margin-left: 6px;
        color: $qt-text;
        opacity: 0.55;
        cursor: help;
      }
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
  }
}
</style>
