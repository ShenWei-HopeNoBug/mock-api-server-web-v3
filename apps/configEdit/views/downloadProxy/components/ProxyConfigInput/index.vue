<template>
  <div class="proxy-config-input">
    <div class="inline-fields">
      <div class="form-item">
        <label>Protocol</label>
        <a-select
          :value="value.protocol"
          :options="protocolOptions"
          allow-clear
          class="field-input"
          @change="onProtocolChange"
        />
      </div>
      <div class="form-item">
        <label>Proxy</label>
        <a-input
          :value="value.proxy || ''"
          allow-clear
          class="field-input"
          @update:value="updateField('proxy', $event)"
        />
      </div>
    </div>
    <div class="form-item includes-item">
      <label>Includes</label>
      <TextListInput
        :value="includes"
        class="field-input"
        @update:value="updateField('includes', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { protocolOptions } from '../../config';
import TextListInput from '../TextListInput/index.vue';

interface Props {
  value: DownloadProxyType.ProxyConfig;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'update:value', value: DownloadProxyType.ProxyConfig): void;
}>();

const includes = computed<string[]>(() =>
  Array.isArray(props.value.includes)
    ? props.value.includes.filter((item): item is string => typeof item === 'string')
    : [],
);

const updateField = <K extends keyof DownloadProxyType.ProxyConfig>(
  key: K,
  value: DownloadProxyType.ProxyConfig[K],
): void => {
  emit('update:value', { ...props.value, [key]: value });
};

const onProtocolChange = (value: string | undefined): void => {
  updateField('protocol', value);
};
</script>

<style scoped lang="scss">
.proxy-config-input {
  width: 100%;
}

.inline-fields {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.form-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  width: 100%;

  label {
    display: flex;
    align-items: center;
    flex: 0 0 80px;
    min-height: 32px;
    padding-left: 10px;

    &::after {
      content: ':';
      padding: 0 4px 0 2px;
    }
  }
}

.field-input {
  flex: 1;
  min-width: 0;
}

.includes-item {
  align-items: flex-start;
}
</style>
