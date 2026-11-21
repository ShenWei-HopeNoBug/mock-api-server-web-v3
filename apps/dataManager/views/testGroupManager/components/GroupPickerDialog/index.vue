<template>
  <a-modal
    v-model:open="visible"
    title="拷入测试组"
    :width="520"
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
    <Spin :spinning="listLoading">
      <template v-if="groupList.length > 0">
        <a-radio-group v-model:value="selectedGroupId" class="group-list">
          <a-radio v-for="group in groupList" :key="group.id" :value="group.id" class="group-item">
            <span class="group-name">{{ group.name || '未命名组' }}</span>
            <span class="group-meta">
              {{ group.item_count || 0 }} 条接口
              <a-tag v-if="group.enabled" color="green" class="enabled-tag">启用中</a-tag>
            </span>
          </a-radio>
        </a-radio-group>
        <div v-if="targetEnabled" class="tip">
          目标组当前处于启用状态，拷入数据需重启 mock 服务后生效
        </div>
      </template>
      <a-empty v-else-if="!listLoading" description="暂无测试组">
        <template #description>
          <span>暂无测试组，</span>
          <a-button type="link" class="empty-link" @click="onGoCreate">去测试组页新建</a-button>
        </template>
      </a-empty>
      <a-checkbox v-if="groupList.length > 0" v-model:checked="copyVariants" class="copy-check">
        连带复制响应变体
      </a-checkbox>
    </Spin>
  </a-modal>
</template>

<script lang="ts" setup name="GroupPickerDialog">
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import Spin from '@/components/Spin/index.vue';
import type { DataManagerType } from '#/qt/dataManager';
import type { TestGroupManagerType } from '../../type';
import { useTestGroupApi } from '../../hooks/useTestGroupApi';

interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emits = defineEmits<{
  (e: 'submit', payload: TestGroupManagerType.GroupPickerSubmitPayload): void;
  (e: 'close'): void;
}>();

const router = useRouter();

const { getTestGroupList } = useTestGroupApi();

const visible = ref<boolean>(false);
const listLoading = ref<boolean>(false);
const groupList = ref<DataManagerType.TestGroupSummary[]>([]);
const selectedGroupId = ref<string>('');
/** 连带复制响应变体：默认勾选 */
const copyVariants = ref<boolean>(true);

/** 目标组当前是否启用中（启用时提示需重启生效） */
const targetEnabled = computed<boolean>(() => {
  return Boolean(groupList.value.find(group => group.id === selectedGroupId.value)?.enabled);
});

/** 打开弹窗并加载组列表 */
const show = (): void => {
  selectedGroupId.value = '';
  copyVariants.value = true;
  visible.value = true;

  listLoading.value = true;
  getTestGroupList()
    .then(res => {
      groupList.value = Array.isArray(res?.list) ? res.list : [];
    })
    .finally(() => {
      listLoading.value = false;
    });
};

const close = (): void => {
  visible.value = false;
  emits('close');
};

const onOk = (): void => {
  if (!selectedGroupId.value) {
    message.error('请选择目标测试组');
    return;
  }
  emits('submit', {
    group_id: selectedGroupId.value,
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
.group-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;

  .group-item {
    display: flex;
    align-items: center;
    padding: 8px 4px;
    margin-inline-end: 0;

    :deep(.ant-radio) {
      align-self: flex-start;
      margin-top: 3px;
    }

    .group-name {
      font-weight: 500;
    }

    .group-meta {
      margin-left: 8px;
      color: $qt-text;
      opacity: 0.65;
      font-size: 12px;
    }

    .enabled-tag {
      margin-inline-start: 6px;
    }
  }
}

.tip {
  margin-top: 8px;
  color: $qt-warning;
  font-size: 12px;
}

.copy-check {
  margin-top: 16px;
}

.empty-link {
  padding: 0;
  height: auto;
}
</style>
