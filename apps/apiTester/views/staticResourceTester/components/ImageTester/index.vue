<template>
  <div class="image-tester">
    <div class="panel-section">
      <StaticUrlInput v-model:value="imageInput" class="url-input" />
      <a-button type="primary" class="load-btn" @click="onImageLoad">加载图片</a-button>
    </div>
    <ImageLoadTester :src="activeImageUrl" />
  </div>
</template>

<script lang="ts" setup name="imageTester">
import { ref } from 'vue';
import ImageLoadTester from '../ImageLoadTester/index.vue';
import StaticUrlInput from '../StaticUrlInput/index.vue';

// const imageInput = ref<string>('');
const imageInput = ref<string>(
  'http://localhost:5000/static/0b036f0016684eb0b4d7c6fc3b6850f6.webp',
);
const activeImageUrl = ref<string>('');

const onImageLoad = () => {
  activeImageUrl.value = imageInput.value.trim();
};
</script>

<style scoped lang="scss">
.image-tester {
  width: 100%;

  .panel-section {
    width: 100%;
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    align-items: flex-end;

    .url-input {
      flex: 1;
    }

    .load-btn {
      flex-shrink: 0;
    }
  }
}
</style>
