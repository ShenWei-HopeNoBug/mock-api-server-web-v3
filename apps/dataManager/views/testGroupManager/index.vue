<template>
  <div class="test-group-manager">
    <a-card class="header">
      <div class="header-row">
        <a-button class="btn" type="primary" @click="onAdd">新建测试组</a-button>
        <a-tooltip placement="bottomLeft">
          <template #title>
            <div>启用新组会顶替当前启用组</div>
            <div>启用/停用与组内数据变更，均需重启 mock 服务后生效</div>
          </template>
          <QuestionCircleOutlined class="tip-icon" />
        </a-tooltip>
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
              {{ index + 1 }}
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
        </a-table>
      </Spin>
    </a-card>

    <GroupFormDialog ref="groupFormDialogRef" :loading="formLoading" @submit="onFormSubmit" />
  </div>
</template>

<script lang="ts" setup name="testGroupManager">
import { computed, nextTick, ref } from 'vue';
import { message } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import Spin from '@/components/Spin/index.vue';
import GroupFormDialog from './components/GroupFormDialog/index.vue';
import { defaultTableHeight, tableHeightOffset, tableMinHeight, groupTableColumns } from './config';
import type { TestGroupManagerType } from './type';
import { useDataManagerApi } from '@apps/dataManager/hooks/useDataManagerApi';

const router = useRouter();

const {
  getTestGroupList,
  createTestGroup,
  updateTestGroup,
  deleteTestGroup,
  enableTestGroup,
  disableTestGroup,
} = useDataManagerApi({
  onReady: () => {
    nextTick(() => {
      fetchList();
    });
  },
});

/** 组表单弹窗实例 */
const groupFormDialogRef = ref<InstanceType<typeof GroupFormDialog> | null>(null);

/** 组列表数据 */
const tableData = ref<TestGroupManagerType.GroupRecord[]>([]);
/** 表格可视高度（单位 px） */
const tableHeight = ref<number>(defaultTableHeight);
/** 列表加载态 */
const listLoading = ref<boolean>(false);
/** 组表单提交态 */
const formLoading = ref<boolean>(false);
/** 正在切换启用态的组 id（switch 行级 loading） */
const togglingId = ref<string>('');
/** 删除中的组 id */
const deletingId = ref<string>('');

/** 表格级 loading */
const tableLoading = computed<boolean>(() => {
  return listLoading.value || Boolean(deletingId.value);
});

/** 拉取组列表 */
const fetchList = (): void => {
  listLoading.value = true;
  getTestGroupList()
    .then(res => {
      tableData.value = Array.isArray(res?.list) ? res.list : [];
    })
    .finally(() => {
      listLoading.value = false;
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

/** 新建按钮点击 */
const onAdd = (): void => {
  groupFormDialogRef.value?.show?.();
};

/**
 * 重命名按钮点击。
 * @param record 行数据
 */
const onRename = (record: TestGroupManagerType.GroupRecord = {}): void => {
  groupFormDialogRef.value?.show?.({ id: record.id, name: record.name });
};

/**
 * 组表单提交（新建/重命名共用出口）。
 * @param payload 表单数据（带 id 为重命名）
 */
const onFormSubmit = (payload: { id?: string; name: string }): void => {
  const { id, name } = payload;
  formLoading.value = true;
  const request = id ? updateTestGroup({ id, name }) : createTestGroup({ name });
  request
    .then(() => {
      message.success(id ? '重命名成功' : '新建测试组成功');
      groupFormDialogRef.value?.close?.();
      fetchList();
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
      fetchList();
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
  deletingId.value = id;
  deleteTestGroup({ id })
    .then(() => {
      message.success('删除测试组成功');
      fetchList();
    })
    .finally(() => {
      deletingId.value = '';
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

    .header-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      .tip-icon {
        margin-left: 10px;
        color: $qt-text;
        opacity: 0.55;
        cursor: help;
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

    .group-name {
      font-weight: 500;
      word-break: break-all;
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
