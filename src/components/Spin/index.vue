<template>
  <div class="spin">
    <slot></slot>
    <div v-if="spinning" :style="maskStyleRef" class="mask">
      <div class="loading-area">
        <div class="loading-icon">
          <LoadingOutlined />
        </div>
        <div class="loading-tip">{{ tip }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" name="Spin" setup>
import { computed, CSSProperties } from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';
import i18n from '@/locales';

interface Props {
  spinning?: boolean;
  zIndex?: number;
  tip?: string;
  maskStyle?: CSSProperties;
}

const props = withDefaults(defineProps<Props>(), {
  spinning: false,
  zIndex: 999,
  tip: i18n.global.t('global.loading'),
  maskStyle: () => ({}),
});

const maskStyleRef = computed((): CSSProperties => ({ zIndex: props.zIndex, ...props.maskStyle }));
</script>

<style lang="scss" scoped>
.spin {
  width: 100%;
  height: 100%;
  position: relative;

  .mask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    background-color: rgba(255, 255, 255, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: default;
    border-radius: inherit;

    .loading-area {
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 8px;
    }

    .loading-icon {
      height: 32px;
      width: 32px;
      font-size: 32px;
      color: #1677ff;
      line-height: 1;
    }

    .loading-tip {
      width: 100%;
      line-height: 22px;
      font-weight: 400;
      text-align: center;
      font-size: 14px;
      word-break: break-word;
      color: #1677ff;
    }
  }
}
</style>
