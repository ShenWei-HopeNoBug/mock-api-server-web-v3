<template>
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '重命名测试组' : '新建测试组'"
    :width="480"
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
    <a-form layout="vertical" class="group-form">
      <a-form-item label="组名称">
        <a-input
          v-model:value="form.name"
          placeholder="请输入测试组名称"
          :maxlength="50"
          allow-clear
          @press-enter="onOk"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup name="GroupFormDialog">
import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TestGroupManagerType } from '../../type';

interface Props {
  loading?: boolean;
}

interface ShowOptions {
  /** 编辑模式（重命名）时传入组 id */
  id?: string;
  /** 编辑模式下的初始名称 */
  name?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emits = defineEmits<{
  (e: 'submit', payload: { id: string; name: string }): void;
  (e: 'close'): void;
}>();

const visible = ref<boolean>(false);
/** 编辑目标 id（新建模式为空） */
const curId = ref<string>('');
const form = reactive<TestGroupManagerType.GroupForm>({ name: '' });

const isEdit = computed<boolean>(() => Boolean(curId.value));

/** 打开弹窗；传 options 为编辑模式，否则为新建模式 */
const show = (options: ShowOptions = {}): void => {
  curId.value = options.id || '';
  form.name = options.name || '';
  visible.value = true;
};

const close = (): void => {
  visible.value = false;
  emits('close');
};

const onOk = (): void => {
  const name = (form.name || '').trim();
  if (!name) {
    message.error('请输入组名称');
    return;
  }
  emits('submit', { id: curId.value || '', name });
};

defineExpose({ show, close });
</script>

<style scoped lang="scss">
.group-form {
  margin-top: 8px;
}
</style>
