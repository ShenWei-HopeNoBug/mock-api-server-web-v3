<template>
  <div class="proxy-config-input">
    <div class="inline-fields">
      <div class="form-item">
        <label>Protocol</label>
        <a-select
          v-model:value="config.protocol"
          :options="protocolOptions"
          :disabled="disabled"
          allow-clear
          class="field-input"
          @change="onChange"
        />
      </div>
      <div class="form-item">
        <label>Proxy</label>
        <a-input
          v-model:value="config.proxy"
          :disabled="disabled"
          allow-clear
          class="field-input"
          @change="onChange"
        />
      </div>
    </div>
    <div class="form-item includes-item">
      <label>Includes</label>
      <TextListInput
        v-model:value="config.includes"
        :disabled="disabled"
        class="field-input"
        @change="onChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { DownloadProxyType } from '#/qt/downloadProxy';
import { getDefaultDownloadProxy, protocolOptions } from '../../config';
import { isPlainObject } from 'lodash-es';
import TextListInput from '@/components/ui/input/TextListInput/index.vue';

interface Props {
  value?: DownloadProxyType.ProxyConfig;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  disabled: false,
});

const emit = defineEmits<{
  (event: 'update:value', value: DownloadProxyType.ProxyConfig): void;
  (event: 'change', value: DownloadProxyType.ProxyConfig): void;
}>();

const config = ref<DownloadProxyType.ProxyConfig>(getDefaultDownloadProxy());

const onChange = (): void => {
  emit('update:value', config.value);
  emit('change', config.value);
};

watch(
  () => props.value,
  obj => {
    if (obj && isPlainObject(obj)) {
      config.value = obj;
    } else {
      onChange();
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.proxy-config-input {
  width: 100%;
}

.inline-fields {
  display: flex;
  margin-bottom: 14px;
}

.form-item {
  display: flex;
  align-items: flex-start;
  min-width: 0;
  width: 100%;

  &:not(:last-child) {
    margin-bottom: 14px;
  }

  label {
    display: flex;
    align-items: center;
    flex: 0 0 80px;
    min-height: 32px;
    padding-left: 10px;
    margin-right: 8px;

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
