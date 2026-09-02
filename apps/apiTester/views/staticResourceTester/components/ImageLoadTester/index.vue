<template>
  <div class="image-load-tester">
    <div class="url-row">
      <a-input v-model:value="url" placeholder="图片 URL" allow-clear class="url-input" />
      <a-button type="primary" :loading="loading" @click="onLoad">加载</a-button>
      <a-button @click="onRefresh">强制刷新</a-button>
    </div>

    <Spin :spinning="loading" class="preview-wrap">
      <img v-if="imgSrc" :key="imgSrc" :src="imgSrc" class="preview-img" />
    </Spin>
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div class="meta-card">
      <div class="meta-row">
        <strong>总耗时：</strong>
        {{ durationText }}
      </div>
      <div class="meta-row">
        <strong>尺寸：</strong>
        {{ imgSize }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="ImageLoadTester">
import { ref, computed, watch } from 'vue';
import Spin from '@/components/Spin/index.vue';
import getImageSizeData from '@/utils/getImageSizeData';
import { generateUUID } from '@/utils';

interface Props {
  /** 待测图片 URL */
  src?: string;
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
});

const url = ref<string>(props.src);
const imgSrc = ref<string>('');
const loading = ref<boolean>(false);
const startTime = ref<number>(0);
const duration = ref<number | null>(null);
const imgWidth = ref<number>(0);
const imgHeight = ref<number>(0);
const errorMsg = ref<string>('');
const currentReqId = ref<string>(generateUUID());

const durationText = computed(() => (duration.value !== null ? `${duration.value}ms` : '-'));

const imgSize = computed(() => {
  if (imgWidth.value && imgHeight.value) {
    return `${imgWidth.value} x ${imgHeight.value}`;
  }
  return '-';
});

const reset = () => {
  duration.value = null;
  imgWidth.value = 0;
  imgHeight.value = 0;
  errorMsg.value = '';
};

const loadImage = async (forceRefresh = false) => {
  if (!url.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  reset();

  let targetUrl = url.value;
  if (forceRefresh) {
    const sep = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${sep}_t=${Date.now()}`;
  }

  const reqId = generateUUID();
  currentReqId.value = reqId;

  startTime.value = performance.now();
  imgSrc.value = targetUrl;

  const result = await getImageSizeData(targetUrl);

  if (reqId !== currentReqId.value) {
    return;
  }

  duration.value = Math.round(performance.now() - startTime.value);

  if (result.error) {
    errorMsg.value = '图片加载失败';
  } else {
    imgWidth.value = result.width;
    imgHeight.value = result.height;
  }
  loading.value = false;
};

const onLoad = () => loadImage(false);
const onRefresh = () => loadImage(true);

watch(
  () => props.src,
  newSrc => {
    url.value = newSrc;
    loadImage(false);
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.image-load-tester {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .url-row {
    display: flex;
    gap: 8px;
    align-items: center;

    .url-input {
      flex: 1;
    }
  }

  .preview-wrap {
    width: 250px;
    height: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    background: #fafafa;

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
    }
  }

  .error-msg {
    color: #ff4d4f;
  }

  .meta-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
    padding: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    background: #fff;
    font-size: 13px;

    .meta-row {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
