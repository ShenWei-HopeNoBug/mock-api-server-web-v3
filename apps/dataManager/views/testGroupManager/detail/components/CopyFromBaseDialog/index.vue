<template>
  <a-modal
    v-model:open="visible"
    title="从已有接口拷入"
    :width="920"
    :mask-closable="false"
    :keyboard="false"
    centered
    destroy-on-close
    :confirm-loading="loading"
    ok-text="确定"
    cancel-text="取消"
    @ok="onOk"
    @cancel="close"
  >
    <div class="search-bar">
      <a-input
        v-model:value="searchForm.url"
        placeholder="请求 Url 关键词"
        class="search-input"
        allow-clear
        @press-enter="onSearch"
      />
      <a-select
        v-model:value="searchForm.method"
        placeholder="请求类型"
        class="search-select"
        :options="methodOptions"
        allow-clear
      />
      <a-select
        v-model:value="searchForm.type"
        placeholder="数据来源"
        class="search-select"
        :options="typeOptions"
        allow-clear
      />
      <a-button type="primary" @click="onSearch">查询</a-button>
    </div>

    <a-table
      :columns="pickerTableColumns"
      :data-source="tableData"
      :loading="listLoading"
      row-key="id"
      size="small"
      :row-selection="rowSelection"
      :pagination="paginationProps"
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
          {{ text || '-' }}
        </template>
      </template>
    </a-table>

    <div class="footer-bar">
      <a-checkbox v-model:checked="copyVariants">连带复制响应变体</a-checkbox>
      <span class="selected-count">已选 {{ selectedRowKeys.length }} 条</span>
    </div>
    <div v-if="selectedRowKeys.length > 0" class="tip">
      组内已存在相同 key 的条目时按「后者覆盖前者」处理
    </div>
  </a-modal>
</template>

<script lang="ts" setup name="CopyFromBaseDialog">
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TableRowSelection } from 'ant-design-vue/es/table/interface';
import { API_TYPE_ENUM, METHOD_ENUM } from '@apps/dataManager/enum';
import type { DataManagerType } from '#/qt/dataManager';
import type { TestGroupManagerType } from '../../../type';
import { useTestGroupApi } from '../../../hooks/useTestGroupApi';

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

const { getMockDataPage } = useTestGroupApi();

const pickerTableColumns: TestGroupManagerType.TableColumn[] = [
  { title: '请求Url', dataIndex: 'url', key: 'url' },
  { title: '请求类型', dataIndex: 'method', key: 'method', width: 100 },
  {
    title: 'Content-Type',
    dataIndex: 'request_content_type',
    key: 'request_content_type',
    width: 220,
  },
  { title: '请求参数', dataIndex: 'params', key: 'params', width: 200 },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
];

const methodOptions = METHOD_ENUM;
const typeOptions = API_TYPE_ENUM;

const visible = ref<boolean>(false);
const listLoading = ref<boolean>(false);
const tableData = ref<DataManagerType.ApiData[]>([]);
const total = ref<number>(0);
const pageNum = ref<number>(1);
const pageSize = ref<number>(10);

const searchForm = ref<TestGroupManagerType.CopySearchForm>({});
const selectedRowKeys = ref<string[]>([]);
/** 连带复制响应变体：默认勾选 */
const copyVariants = ref<boolean>(true);

const rowSelection = computed<TableRowSelection>(() => ({
  selectedRowKeys: selectedRowKeys.value,
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

/** 分页拉取 base 接口数据 */
const getDataSource = (num: number, size: number): void => {
  listLoading.value = true;
  const params: DataManagerType.GetMockDataPageParams = { page_num: num, page_size: size };
  const { url, method, type } = searchForm.value;
  if (url) {
    params.url = url;
  }
  if (method) {
    params.method = method;
  }
  if (type) {
    params.type = type;
  }
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

/** 查询按钮：重置到第一页 */
const onSearch = (): void => {
  getDataSource(1, pageSize.value);
};

/** 表格分页变化 */
const onTableChange = (pag: { current?: number; pageSize?: number }): void => {
  getDataSource(pag.current || 1, pag.pageSize || pageSize.value);
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
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;

  .search-input {
    flex: 1;
    min-width: 180px;
  }

  .search-select {
    width: 180px;
  }
}

.params {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;

  .selected-count {
    color: $qt-text;
    opacity: 0.65;
    font-size: 12px;
  }
}

.tip {
  margin-top: 8px;
  color: $qt-warning;
  font-size: 12px;
}
</style>
