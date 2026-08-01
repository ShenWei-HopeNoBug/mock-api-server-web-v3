<template>
  <a-modal
    v-model:visible="visible"
    title="抓包接口数据详情"
    :width="'calc(100vw - 48px)'"
    :footer="null"
    centered
    destroy-on-close
    wrap-class-name="output-manager-detail-dialog"
    @cancel="close"
  >
    <div v-if="visible" class="scroll">
      <div class="content" v-jump-forbid>
        <div v-for="(item, i) in columns" :key="`info_${i}`" class="info-item">
          <div class="label">{{ item.label }}</div>
          <div v-if="item.type === 'jsonString'" class="value">
            <div class="json-area">
              <JsonInput
                :value="getValue(item)"
                :readonly="item.readonly"
                :code-editor-style="codeEditorStyleMap[item.key]"
                default-copy-content="{}"
              />
            </div>
          </div>
          <div v-else class="value">{{ getValue(item) }}</div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup name="DetailDialog">
import { ref } from 'vue';
import JsonInput from '@/components/ui/input/JsonInput/index.vue';
import { columns, codeEditorStyleMap } from './config';
import type { DetailDialogType } from './type';
import { isPlainObject } from 'lodash-es';

interface Props {
  dataSource?: DetailDialogType.DataSource;
}

const props = withDefaults(defineProps<Props>(), {
  dataSource: () => ({}),
});

const emits = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref<boolean>(false);

const getValue = (options: DetailDialogType.ColumnItem): string => {
  const key = options.key || '';
  if (!key) {
    return '';
  }

  if (!isPlainObject(props.dataSource)) {
    return '';
  }

  const value = props.dataSource[key];

  return typeof value !== 'undefined' ? value : '-';
};

const show = (): void => {
  visible.value = true;
};

const close = (): void => {
  visible.value = false;
  emits('close');
};

defineExpose({
  show,
  close,
});
</script>

<style scoped lang="scss">
.scroll {
  width: 100%;
  height: calc(100vh - 160px);
  overflow: hidden;
  overflow-y: auto;
}

.content {
  width: 100%;
  padding-right: 8px;
  scrollbar-gutter: stable;
  word-break: break-word;

  .info-item {
    width: 100%;
    margin-bottom: 20px;

    .label {
      font-size: 16px;
      font-weight: bold;
      line-height: 28px;
      margin-bottom: 4px;

      &:after {
        content: ':';
        padding: 0 4px;
      }
    }
  }
}

.json-area {
  padding: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
