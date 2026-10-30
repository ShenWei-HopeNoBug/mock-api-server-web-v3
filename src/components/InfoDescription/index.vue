<template>
  <div class="info-description">
    <div
      v-for="(info, i) in columns"
      :key="`info_${i}`"
      :class="`info-item align-${align}`"
      :style="infoItemStyle"
    >
      <div class="label">{{ info.label }}</div>
      <div v-if="info.slot" class="value">
        <slot
          :index="i"
          :options="info"
          :row-key="info.rowKey"
          :value="info.value"
          name="value"
        ></slot>
      </div>
      <template v-else>
        <a-tooltip
          v-if="info.value && info.tooltip"
          :destroy-tooltip-on-hide="true"
          :title="info.value"
          placement="right"
        >
          <div :class="{ value: true, ellipsis: isEllipsis(info) }">
            {{ info.value }}
          </div>
        </a-tooltip>
        <div v-else :class="{ value: true, ellipsis: isEllipsis(info) }">
          {{ info.value }}
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" name="InfoDescription" setup>
import type { InfoDescriptionType } from './type.d';

withDefaults(defineProps<InfoDescriptionType.Props>(), {
  columns: () => [],
  align: 'between',
});

const isEllipsis = (options: InfoDescriptionType.InfoOptions): boolean => {
  const { ellipsis = true } = options;
  return ellipsis;
};
</script>

<style lang="scss" scoped>
.info-description {
  width: 100%;

  .info-item {
    width: 100%;
    display: flex;

    &:not(:last-child) {
      margin-bottom: 4px;
    }

    .label {
      margin-right: 8px;
      font-weight: bold;

      &:after {
        content: ':';
        padding-left: 4px;
      }
    }

    .value {
      flex: 1;
      overflow: hidden;
    }

    .ellipsis {
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .align-between {
    justify-content: space-between;

    .value {
      text-align: right;
    }
  }

  .align-left {
    justify-content: flex-start;
  }
}
</style>
