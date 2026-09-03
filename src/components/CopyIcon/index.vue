<template>
  <a-tooltip v-if="tooltip" :title="tooltipTitle">
    <div class="copy-icon" :class="{ 'copy-icon--disabled': copied }" @click.stop="onCopy">
      <component :is="copied ? CheckOutlined : CopyOutlined" />
    </div>
  </a-tooltip>
  <div v-else class="copy-icon" :class="{ 'copy-icon--disabled': copied }" @click.stop="onCopy">
    <component :is="copied ? CheckOutlined : CopyOutlined" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { message } from 'ant-design-vue';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { useI18n } from 'vue-i18n';
import { copyText } from '@/utils';

interface Props {
  text?: string;
  tooltip?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  tooltip: false,
});

const { t } = useI18n();
const copied = ref<boolean>(false);
const timer = ref<number>();
const tooltipTitle = computed(() =>
  copied.value ? t('global.toast.copied') : t('global.toast.copy'),
);

const resetCopiedState = () => {
  copied.value = false;
  clearTimeout(timer.value);
};

const onCopy = async () => {
  if (!props.text || copied.value) {
    return;
  }

  try {
    await copyText(props.text);
    message.success(t('global.toast.copySuccess'));
    copied.value = true;
    const delay: number = 2000;
    timer.value = window.setTimeout(() => {
      resetCopiedState();
    }, delay);
  } catch (e) {
    console.warn('onCopy error', e);
    message.error(t('global.toast.copyFailed'));
  }
};

onBeforeUnmount(() => {
  clearTimeout(timer.value);
});
</script>

<style scoped lang="scss">
.copy-icon {
  color: #1677ff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  line-height: 1;

  &--disabled {
    color: #52c41a;
  }
}
</style>
