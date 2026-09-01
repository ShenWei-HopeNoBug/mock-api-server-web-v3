<template>
  <div class="static-resource-url-input">
    <a-radio-group
      v-model:value="innerMode"
      button-style="solid"
      size="small"
      class="mode-switch"
      @change="onModeChange"
    >
      <a-radio-button value="template">模板</a-radio-button>
      <a-radio-button value="custom">自定义</a-radio-button>
    </a-radio-group>

    <a-input-group v-if="innerMode === 'template'" compact class="template-group">
      <a-input :value="`http://localhost:`" :disabled="true" class="prefix-text" />
      <a-input-number
        v-model:value="portNum"
        :min="1000"
        :max="9999"
        :controls="true"
        class="port-input"
        @change="onTemplateChange"
      />
      <a-input :value="`/`" :disabled="true" class="separator" />
      <a-select v-model:value="mode" class="mode-select" @change="onTemplateChange">
        <a-select-option value="static">static</a-select-option>
        <a-select-option value="static_delay">static_delay</a-select-option>
      </a-select>
      <a-input :value="`/`" :disabled="true" class="separator" />
      <a-input
        v-model:value="path"
        :allow-clear="true"
        class="path-input"
        placeholder="输入资源路径，如 test.jpg"
        @change="onTemplateChange"
      />
    </a-input-group>

    <a-input
      v-else
      v-model:value="customUrl"
      allow-clear
      class="custom-input"
      placeholder="输入完整 URL，如 http://localhost:5000/static/test.jpg"
      @change="onCustomChange"
    />
  </div>
</template>

<script lang="ts" setup name="StaticUrlInput">
import { ref, watch } from 'vue';
import type { StaticUrlInputType } from './type.d';

interface Props {
  value: string;
  defaultPort?: number;
  mode?: StaticUrlInputType.InputMode;
}

const props = withDefaults(defineProps<Props>(), {
  defaultPort: 5000,
  mode: 'template',
});

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
  (e: 'change', value: string): void;
}>();

const FULL_URL_RE = /^http:\/\/localhost:(\d+)\/(static|static_delay)\/(.*)$/;

const innerMode = ref<StaticUrlInputType.InputMode>(props.mode);
const portNum = ref<number>(props.defaultPort);
const mode = ref<StaticUrlInputType.StaticMode>('static');
const path = ref('');
const customUrl = ref('');

const assembleUrl = (): string =>
  `http://localhost:${portNum.value}/${mode.value}/${path.value.replace(/^\/+/, '')}`;

const parseUrl = (val: string): boolean => {
  if (val) {
    const fullMatch = val.match(FULL_URL_RE);
    if (fullMatch) {
      const port = Number(fullMatch[1]);
      portNum.value = port >= 1000 && port <= 9999 ? port : props.defaultPort;
      mode.value = fullMatch[2] as StaticUrlInputType.StaticMode;
      path.value = fullMatch[3];
      return port >= 1000 && port <= 9999;
    }
  }

  // 兜底：无法解析，重置为默认值
  portNum.value = props.defaultPort;
  mode.value = 'static';
  path.value = '';
  return false;
};

const onTemplateChange = () => {
  const url = assembleUrl();
  emit('update:value', url);
  emit('change', url);
};

const onCustomChange = () => {
  emit('update:value', customUrl.value);
  emit('change', customUrl.value);
};

const onModeChange = (e: any) => {
  const newMode = e.target.value as StaticUrlInputType.InputMode;
  const prevUrl = props.value;
  if (newMode === 'custom') {
    customUrl.value = assembleUrl();
  } else {
    parseUrl(customUrl.value);
  }
  const nextUrl = newMode === 'custom' ? customUrl.value : assembleUrl();
  if (nextUrl !== prevUrl) {
    emit('update:value', nextUrl);
    emit('change', nextUrl);
  }
};

watch(
  () => props.value,
  val => {
    if (typeof val !== 'string') {
      if (innerMode.value === 'template') {
        onTemplateChange();
      } else {
        onCustomChange();
      }

      return;
    }

    if (innerMode.value === 'template') {
      const matched = parseUrl(val);
      if (!matched) {
        onTemplateChange();
      }
    } else {
      customUrl.value = val;
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.static-resource-url-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .mode-switch {
    align-self: flex-start;
  }

  .template-group {
    display: flex;
    width: 100%;
  }

  .custom-input {
    width: 100%;
  }

  .prefix-text {
    width: auto !important;
    color: #999;
    background: #fafafa;
    pointer-events: none;
  }

  .port-input {
    width: 80px;
    text-align: center;
  }

  .separator {
    width: 24px !important;
    text-align: center;
    color: #999;
    background: #fafafa;
    pointer-events: none;
  }

  .mode-select {
    width: 130px;
  }

  .path-input {
    flex: 1;
  }
}
</style>
