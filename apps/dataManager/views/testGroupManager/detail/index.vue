<template>
  <div class="test-group-detail">
    <a-card class="header">
      <div class="header-row">
        <div class="title-side">
          <a-button class="back-btn" @click="onBack">
            <ArrowLeftOutlined />
            返回
          </a-button>
          <span class="group-name">{{ groupInfo.name || '未命名组' }}</span>
          <a-tag v-if="groupInfo.enabled" color="green">启用中</a-tag>
          <span class="item-count">{{ tableData.length }} 条接口</span>
          <a-tooltip placement="bottomLeft">
            <template #title>
              <div>
                组条目仅当 Url / Method / Content-Type / Params 与 base 接口完全一致时才遮蔽该接口
              </div>
              <div>组内接口数据的增删改需重启 mock 服务后生效</div>
            </template>
            <QuestionCircleOutlined class="tip-icon" />
          </a-tooltip>
        </div>
        <a-button class="btn" type="primary" @click="onCopyFromBase">从已有接口拷入</a-button>
      </div>
    </a-card>
    <a-card v-dom-resize="onResize" class="content">
      <Spin>
        <a-table
          :columns="itemTableColumns"
          :data-source="tableData"
          :pagination="false"
          :loading="tableLoading"
          row-key="id"
          :scroll="{ x: 1200, y: tableHeight }"
        >
          <template #bodyCell="{ text, column, record, index }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
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
          </template>
        </a-table>
      </Spin>
    </a-card>

    <UserApiEditorDialog
      ref="userApiEditorDialogRef"
      :loading="editLoading"
      @submit="onUserApiEditorSubmit"
      @close="onUserApiEditorDialogClose"
    />
    <VariantEditorDialog ref="variantEditorDialogRef" @close="onVariantEditorClose" />
    <CopyFromBaseDialog
      ref="copyFromBaseDialogRef"
      :loading="copyLoading"
      @submit="onCopyFromBaseSubmit"
    />
  </div>
</template>

<script lang="ts" setup name="testGroupDetail">
import { computed, nextTick, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import { cloneDeep } from 'lodash-es';
import Spin from '@/components/Spin/index.vue';
import CopyIcon from '@/components/CopyIcon/index.vue';
import UserApiEditorDialog from '@apps/dataManager/views/outputManager/components/UserApiEditorDialog/index.vue';
import VariantEditorDialog from '@apps/dataManager/views/outputManager/components/VariantEditorDialog/index.vue';
import CopyFromBaseDialog from './components/CopyFromBaseDialog/index.vue';
import { defaultTableHeight, tableHeightOffset, tableMinHeight, itemTableColumns } from '../config';
import type { TestGroupManagerType } from '../type';
import type { DataManagerType } from '#/qt/dataManager';
import { useTestGroupApi } from '../hooks/useTestGroupApi';

const route = useRoute();
const router = useRouter();

const groupId = String(route.params.id || '');

const { getTestGroupDetail, editMockData, deleteMockData, copyIntoTestGroup } = useTestGroupApi({
  onReady: () => {
    nextTick(() => {
      fetchDetail();
    });
  },
});

/** 编辑弹窗实例 */
const userApiEditorDialogRef = ref<InstanceType<typeof UserApiEditorDialog> | null>(null);
/** 响应变体弹窗实例 */
const variantEditorDialogRef = ref<InstanceType<typeof VariantEditorDialog> | null>(null);
/** 拉取拷入弹窗实例 */
const copyFromBaseDialogRef = ref<InstanceType<typeof CopyFromBaseDialog> | null>(null);

/** 组信息（detail 返回的组字段） */
const groupInfo = ref<DataManagerType.TestGroupDetail>({});
/** 组内条目列表 */
const tableData = ref<TestGroupManagerType.ItemRecord[]>([]);
/** 当前编辑行数据（弹窗提交的 form 不含 id 等非表单项字段，id 须从这里取） */
const curRow = ref<TestGroupManagerType.ItemRecord>({});
/** 表格可视高度（单位 px） */
const tableHeight = ref<number>(defaultTableHeight);
/** 详情加载态 */
const detailLoading = ref<boolean>(false);
/** 条目操作态 */
const itemActionLoading = ref<boolean>(false);
/** 编辑提交态 */
const editLoading = ref<boolean>(false);
/** 拷入提交态 */
const copyLoading = ref<boolean>(false);

const tableLoading = computed<boolean>(() => {
  return detailLoading.value || itemActionLoading.value;
});

/** 拉取组详情 */
const fetchDetail = (): void => {
  if (!groupId) {
    return;
  }
  detailLoading.value = true;
  getTestGroupDetail({ id: groupId })
    .then(res => {
      groupInfo.value = res || {};
      tableData.value = Array.isArray(res?.items) ? res.items : [];
    })
    .finally(() => {
      detailLoading.value = false;
    });
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

/** 返回组列表 */
const onBack = (): void => {
  router.push({ name: 'testGroupManager' });
};

/**
 * 编辑按钮点击。
 * @param record 行数据
 */
const onEdit = (record: TestGroupManagerType.ItemRecord = {}): void => {
  curRow.value = cloneDeep(record);
  userApiEditorDialogRef.value?.show?.({
    isEdit: true,
    formData: { ...record },
    recordType: record.type,
  });
};

/**
 * 编辑提交：走 /mock_data/update，后端忽略 type/group_id。
 * @param payload 提交载荷
 */
const onUserApiEditorSubmit = (payload: TestGroupManagerType.ItemEditSubmitPayload = {}): void => {
  const { form = {} } = payload;
  const { id = '' } = curRow.value;
  if (!id) {
    message.error('编辑接口数据失败！');
    return;
  }
  editLoading.value = true;
  editMockData({ id, ...form })
    .then(() => {
      message.success('更新接口数据成功');
      userApiEditorDialogRef.value?.close?.();
      fetchDetail();
    })
    .finally(() => {
      editLoading.value = false;
    });
};

/** 编辑弹窗关闭回调 */
const onUserApiEditorDialogClose = (): void => {
  curRow.value = {};
  editLoading.value = false;
};

/**
 * 响应变体按钮点击。
 * @param record 行数据
 */
const onEditVariants = (record: TestGroupManagerType.ItemRecord = {}): void => {
  variantEditorDialogRef.value?.show?.({
    apiDataId: record.id,
  });
};

/** 响应变体弹窗关闭回调：刷新（变体操作可能影响 updated_at） */
const onVariantEditorClose = (): void => {
  fetchDetail();
};

/**
 * 切换条目启用状态。
 * @param record 行数据
 */
const onToggleEnabled = (record: TestGroupManagerType.ItemRecord = {}): void => {
  const { id = '' } = record;
  if (!id) {
    message.error('切换启用状态失败！');
    return;
  }
  const nextEnabled = !record.enabled;
  itemActionLoading.value = true;
  editMockData({ id, enabled: nextEnabled })
    .then(() => {
      message.success(nextEnabled ? '启用成功' : '禁用成功');
      fetchDetail();
    })
    .finally(() => {
      itemActionLoading.value = false;
    });
};

/**
 * 删除条目。
 * @param record 行数据
 */
const onDelete = (record: TestGroupManagerType.ItemRecord = {}): void => {
  const { id = '' } = record;
  if (!id) {
    return;
  }
  itemActionLoading.value = true;
  deleteMockData({ id })
    .then(() => {
      message.success('删除接口数据成功');
      fetchDetail();
    })
    .finally(() => {
      itemActionLoading.value = false;
    });
};

/** 从已有接口拷入按钮点击 */
const onCopyFromBase = (): void => {
  copyFromBaseDialogRef.value?.show?.();
};

/**
 * 拉取拷入提交：逐条拷入，条目默认启用。
 * @param payload { ids, copy_variants }
 */
const onCopyFromBaseSubmit = (payload: { ids?: string[]; copy_variants?: boolean } = {}): void => {
  const { ids = [], copy_variants = true } = payload;
  if (ids.length === 0) {
    return;
  }
  copyLoading.value = true;
  // 逐条串行拷入，保持顺序语义
  let chain: Promise<unknown> = Promise.resolve();
  ids.forEach(apiId => {
    chain = chain.then(() =>
      copyIntoTestGroup({ api_id: apiId, group_id: groupId, copy_variants, enabled: true }),
    );
  });
  chain
    .then(() => {
      message.success(`已拷入 ${ids.length} 条接口到测试组`);
      copyFromBaseDialogRef.value?.close?.();
      fetchDetail();
    })
    .finally(() => {
      copyLoading.value = false;
    });
};
</script>

<style scoped lang="scss">
.test-group-detail {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  flex-direction: column;

  .header {
    width: 100%;
    margin-bottom: 24px;
    flex-shrink: 0;

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .title-side {
        display: flex;
        align-items: center;

        .back-btn {
          margin-right: 14px;
        }

        .group-name {
          font-size: 16px;
          font-weight: 600;
          color: $qt-title;
          margin-right: 10px;
          word-break: break-all;
        }

        .item-count {
          color: $qt-text;
          opacity: 0.65;
          font-size: 12px;
        }

        .tip-icon {
          margin-left: 8px;
          color: $qt-text;
          opacity: 0.55;
          cursor: help;
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
      padding: 14px 20px;
      height: 100%;
    }

    .url-text {
      margin-right: 6px;
      word-break: break-all;
    }

    .params {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .operation {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
    }
  }
}
</style>
