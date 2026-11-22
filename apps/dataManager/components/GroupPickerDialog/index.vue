<template>
  <a-modal
    v-model:open="visible"
    title="拷入测试组"
    :width="960"
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
          :row-selection="rowSelection"
          :pagination="paginationProps"
          :scroll="{ y: tableHeight }"
          @change="onTableChange"
        >
          <template #bodyCell="{ text, column, record }">
            <template v-if="column.key === 'name'">
              <span class="group-name">{{ text || '未命名组' }}</span>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <a-tag :color="record.enabled ? 'green' : 'red'">
                {{ record.enabled ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </template>

          <template #emptyText>
            <a-empty>
              <template #description>
                <span>暂无测试组，</span>
                <a-button type="link" class="empty-link" @click="onGoCreate">
                  去测试组页新建
                </a-button>
              </template>
            </a-empty>
          </template>
        </a-table>
      </div>

      <div class="footer-bar">
        <a-checkbox v-model:checked="copyVariants">连带复制响应变体</a-checkbox>
        <span class="selected-count">已选 {{ selectedRow ? 1 : 0 }} 条</span>
        <span v-if="targetEnabled" class="tip">
          目标组当前处于启用状态，拷入数据需重启 mock 服务后生效
        </span>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup name="GroupPickerDialog">
import { computed, reactive, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import type { TableRowSelection } from 'ant-design-vue/es/table/interface';
import { useRouter } from 'vue-router';
import SearchForm from '@/components/form/SearchForm/index.vue';
import { ENABLED_ENUM } from '@apps/dataManager/enum';
import type { Form as FormType } from '@/components/form/types';
import type { DataManagerType } from '#/qt/dataManager';
import type { GroupPickerDialogType } from './type';
import { useDataManagerApi } from '@apps/dataManager/hooks/useDataManagerApi';

interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emits = defineEmits<{
  (e: 'submit', payload: GroupPickerDialogType.GroupPickerSubmitPayload): void;
  (e: 'close'): void;
}>();

const router = useRouter();

const { getTestGroupPage } = useDataManagerApi();

/** 表格列：picker 精简版（辨识 + 选择），与组列表展示列对齐 */
const pickerTableColumns: { title: string; dataIndex?: string; key: string; width?: number }[] = [
  { title: '组名称', dataIndex: 'name', key: 'name', width: 280 },
  { title: '接口条目数', dataIndex: 'item_count', key: 'item_count', width: 100 },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
];

/** 搜索表单项配置：2 个字段，form-item-col=8 一行放下 */
const searchFormColumns: FormType.FormItemOptions[] = [
  { label: '组名称', key: 'name', inputType: 'input' },
  { label: '启用状态', key: 'enabled', inputType: 'select', options: ENABLED_ENUM },
];

const visible = ref<boolean>(false);
const listLoading = ref<boolean>(false);
const tableData = ref<DataManagerType.TestGroupSummary[]>([]);
const total = ref<number>(0);
/** 分页状态 */
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  pageSizes: ['10', '20', '50'],
});
/** 表格滚动区域高度，由内容区尺寸监听驱动 */
const tableHeight = ref<number>(400);

const searchForm = ref<GroupPickerDialogType.SearchForm>({});
/** 已选行整行数据：targetEnabled 提示依赖其 enabled，翻页后 tableData 换页查不到该行 */
const selectedRow = ref<DataManagerType.TestGroupSummary | null>(null);
/** 连带复制响应变体：默认勾选 */
const copyVariants = ref<boolean>(true);

/** 目标组当前是否启用中（启用时提示需重启生效） */
const targetEnabled = computed<boolean>(() => Boolean(selectedRow.value?.enabled));

const rowSelection = computed<TableRowSelection<DataManagerType.TestGroupSummary>>(() => ({
  type: 'radio',
  selectedRowKeys: selectedRow.value?.id ? [selectedRow.value.id] : [],
  onChange: (_keys, rows) => {
    selectedRow.value = rows?.[0] ?? null;
  },
}));

const paginationProps = computed(() => ({
  total: total.value,
  current: pagination.currentPage,
  pageSize: pagination.pageSize,
  showSizeChanger: true,
  pageSizeOptions: pagination.pageSizes,
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

/** 分页拉取组列表（SearchForm 已过滤空值） */
const getDataSource = (num: number, size: number): void => {
  listLoading.value = true;
  getTestGroupPage({
    ...searchForm.value,
    page_num: num,
    page_size: size,
  })
    .then(res => {
      const { list = [], total: resTotal = 0 } = res || {};
      tableData.value = Array.isArray(list) ? list : [];
      total.value = resTotal;
      pagination.currentPage = num;
      pagination.pageSize = size;
    })
    .finally(() => {
      listLoading.value = false;
    });
};

/** 打开弹窗并重置状态拉取首屏 */
const show = (): void => {
  searchForm.value = {};
  selectedRow.value = null;
  copyVariants.value = true;
  visible.value = true;
  getDataSource(1, pagination.pageSize);
};

const close = (): void => {
  visible.value = false;
  emits('close');
};

/** 搜索表单提交：记录表单值并重置到第一页 */
const onSearchSubmit = (form: GroupPickerDialogType.SearchForm = {}): void => {
  searchForm.value = cloneDeep(form);
  getDataSource(1, pagination.pageSize);
};

/** 表格分页变化 */
const onTableChange = (pag: { current?: number; pageSize?: number }): void => {
  getDataSource(pag.current || 1, pag.pageSize || pagination.pageSize);
};

const onOk = (): void => {
  if (!selectedRow.value?.id) {
    message.error('请选择目标测试组');
    return;
  }
  emits('submit', {
    group_id: selectedRow.value.id,
    copy_variants: copyVariants.value,
  });
};

/** 空态跳转：关闭弹窗后跳测试组页新建 */
const onGoCreate = (): void => {
  close();
  router.push({ name: 'testGroupManager' });
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

    .group-name {
      font-weight: 500;
      word-break: break-all;
    }

    .empty-link {
      padding: 0;
      height: auto;
    }
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
    }

    .tip {
      margin-left: 16px;
      color: $qt-warning;
      font-size: 12px;
    }
  }
}
</style>
