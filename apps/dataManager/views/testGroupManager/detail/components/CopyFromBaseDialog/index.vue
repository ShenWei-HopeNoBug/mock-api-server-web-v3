<template>
  <a-modal
    v-model:open="visible"
    title="从已有接口拷入"
    :width="'calc(100vw - 48px)'"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    wrap-class-name="__modal-wrap-no-scroll__"
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    @ok="onOk"
    @cancel="close"
  >
    <div class="container">
      <div class="search-bar">
        <SearchForm
          :columns="searchFormColumns"
          :form-item-col="8"
          :loading="listLoading"
          @submit="onSearchSubmit"
        />
      </div>

      <div v-dom-resize="onResize" class="content">
        <a-table
          :columns="pickerTableColumns"
          :data-source="tableData"
          :loading="listLoading"
          row-key="id"
          size="small"
          :row-class-name="getEnabledRowClass"
          :row-selection="rowSelection"
          :pagination="paginationProps"
          :scroll="{ x: 1770, y: tableHeight }"
          @change="onTableChange"
        >
          <template #bodyCell="{ text, column, record }">
            <template v-if="column.key === 'params'">
              <div class="params">{{ record.params }}</div>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <a-tag :color="record.enabled ? 'green' : 'red'">
                {{ record.enabled ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'url'">
              <template v-if="text">
                <span class="url-text">{{ text }}</span>
                <CopyIcon :text="text" :tooltip="true" />
              </template>
              <template v-else>-</template>
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-button type="link" @click="onDetail(record)">查看详情</a-button>
            </template>
          </template>
        </a-table>
      </div>

      <div class="footer-bar">
        <a-checkbox v-model:checked="copyVariants">连带复制响应变体</a-checkbox>
        <span class="selected-count">
          已选 {{ selectedRowKeys.length }} 条
          <a-tooltip placement="top">
            <template #title>
              <div>「同 key」= Url / Method / Content-Type / Params 完全一致</div>
              <div>拷入条目与组内已有条目同 key 时，以新拷入的遮蔽原条目</div>
            </template>
            <QuestionCircleOutlined class="tip-icon" />
          </a-tooltip>
        </span>
      </div>
    </div>

    <DetailDialog ref="detailDialogRef" />
  </a-modal>
</template>

<script lang="ts" setup name="CopyFromBaseDialog">
import { computed, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableRowSelection } from 'ant-design-vue/es/table/interface';
import SearchForm from '@/components/form/SearchForm/index.vue';
import CopyIcon from '@/components/CopyIcon/index.vue';
import DetailDialog from '@apps/dataManager/components/DetailDialog/index.vue';
import { getEnabledRowClass } from '@/utils';
import { API_TYPE_ENUM, METHOD_ENUM } from '@apps/dataManager/enum';
import type { Form as FormType } from '@/components/form/types';
import type { DataManagerType } from '#/qt/dataManager';
import type { TestGroupManagerType } from '../../../type';
import { useDataManagerApi } from '@apps/dataManager/hooks/useDataManagerApi';

interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emits = defineEmits<{
  (e: 'submit', payload: { ids: string[]; copy_variants: boolean }): void;
  (e: 'close'): void;
}>();

const { getMockDataPage } = useDataManagerApi();

/** 表格列：与 outputManager tableColumns 展示列同步（剔除其序号/操作列），改列需两边手动同步 */
const pickerTableColumns: TestGroupManagerType.TableColumn[] = [
  { title: '数据来源', dataIndex: 'type', key: 'type', width: 120 },
  { title: '请求Url', dataIndex: 'url', key: 'url', width: 260 },
  { title: '请求类型', dataIndex: 'method', key: 'method', width: 100 },
  {
    title: 'Content-Type',
    dataIndex: 'request_content_type',
    key: 'request_content_type',
    width: 220,
  },
  { title: '请求参数', dataIndex: 'params', key: 'params', width: 240 },
  { title: '响应延时(ms)', dataIndex: 'timeout', key: 'timeout', width: 120 },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
  { title: '操作', key: 'operation', width: 100, fixed: 'right' },
];

/** 搜索表单项配置：3 个字段，form-item-col=8 恰好一行 3 列 */
const searchFormColumns: FormType.FormItemOptions[] = [
  { label: '请求Url', key: 'url', inputType: 'input' },
  { label: '请求类型', key: 'method', inputType: 'select', options: METHOD_ENUM },
  { label: '数据来源', key: 'type', inputType: 'select', options: API_TYPE_ENUM },
];

/** 详情弹窗实例 */
const detailDialogRef = ref<InstanceType<typeof DetailDialog> | null>(null);

const visible = ref<boolean>(false);
const listLoading = ref<boolean>(false);
const tableData = ref<DataManagerType.ApiData[]>([]);
const total = ref<number>(0);
const pageNum = ref<number>(1);
const pageSize = ref<number>(10);
/** 表格滚动区域高度，由内容区尺寸监听驱动 */
const tableHeight = ref<number>(400);

const searchForm = ref<TestGroupManagerType.CopySearchForm>({});
const selectedRowKeys = ref<string[]>([]);
/** 连带复制响应变体：默认勾选 */
const copyVariants = ref<boolean>(true);

const rowSelection = computed<TableRowSelection>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  // 跨页勾选累计：未 preserve 时其它页 key 会在下次勾选时被 antd 按当前页数据过滤丢弃
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

const paginationProps = computed(() => ({
  total: total.value,
  current: pageNum.value,
  pageSize: pageSize.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (num: number) => `共 ${num} 条`,
}));

/** 内容区尺寸变化时重算表格滚动高（扣除表头与内置分页条占位） */
const onResize = (entry: ResizeObserverEntry): void => {
  if (!entry?.target) {
    return;
  }

  const { height } = entry.target.getBoundingClientRect();
  const offset = 80;
  const minHeight = 100;
  tableHeight.value = Math.max(minHeight, height - offset);
};

/** 分页拉取 base 接口数据（SearchForm 已过滤空值） */
const getDataSource = (num: number, size: number): void => {
  listLoading.value = true;
  const params: DataManagerType.GetMockDataPageParams = {
    ...searchForm.value,
    page_num: num,
    page_size: size,
  };
  getMockDataPage(params)
    .then(res => {
      const { list = [], total: resTotal = 0 } = res || {};
      tableData.value = Array.isArray(list) ? list : [];
      total.value = resTotal;
      pageNum.value = num;
      pageSize.value = size;
    })
    .finally(() => {
      listLoading.value = false;
    });
};

/** 打开弹窗并拉取首屏 */
const show = (): void => {
  searchForm.value = {};
  selectedRowKeys.value = [];
  copyVariants.value = true;
  visible.value = true;
  getDataSource(1, pageSize.value);
};

const close = (): void => {
  visible.value = false;
  emits('close');
};

/** 搜索表单提交：记录表单值并重置到第一页 */
const onSearchSubmit = (form: TestGroupManagerType.CopySearchForm = {}): void => {
  searchForm.value = cloneDeep(form);
  getDataSource(1, pageSize.value);
};

/** 表格分页变化 */
const onTableChange = (pag: { current?: number; pageSize?: number }): void => {
  getDataSource(pag.current || 1, pag.pageSize || pageSize.value);
};

/** 查看详情按钮点击：复用共享详情弹窗 */
const onDetail = (record: DataManagerType.ApiData = {}): void => {
  detailDialogRef.value?.show?.(record.id);
};

const onOk = (): void => {
  if (selectedRowKeys.value.length === 0) {
    message.error('请选择要拷入的接口');
    return;
  }
  emits('submit', { ids: selectedRowKeys.value, copy_variants: copyVariants.value });
};

defineExpose({ show, close });
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: calc(100vh - 220px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .search-bar {
    margin-bottom: 14px;
    flex-shrink: 0;
  }

  .content {
    width: 100%;
    flex: 1;
    overflow: hidden;

    // 内置分页条默认 margin 16px 过大，收紧与下方勾选行的视觉间距
    :deep(.ant-table-pagination.ant-pagination) {
      margin: 8px 0;
    }
  }

  .params {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .url-text {
    margin-right: 6px;
    word-break: break-all;
  }

  .footer-bar {
    display: flex;
    align-items: center;
    margin-top: 8px;
    flex-shrink: 0;

    .selected-count {
      display: inline-flex;
      align-items: center;
      margin-left: 16px;
      color: $qt-text;
      opacity: 0.65;
      font-size: 12px;

      .tip-icon {
        margin-left: 6px;
        cursor: help;
      }
    }
  }
}
</style>
