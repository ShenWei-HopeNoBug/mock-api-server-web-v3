<template>
  <div class="static-resource-tester">
    <h2>静态资源测试</h2>

    <div class="tab-bar">
      <a-radio-group v-model:value="activeTab" button-style="solid">
        <a-radio-button value="image">图片测试</a-radio-button>
        <a-radio-button value="video">视频测试</a-radio-button>
        <a-radio-button value="speed">网速测试</a-radio-button>
      </a-radio-group>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'image'" class="tab-pane">
        <ImageTester />
      </div>

      <div v-if="activeTab === 'video'" class="tab-pane">
        <VideoTester />
      </div>

      <div v-if="activeTab === 'speed'" class="tab-pane">
        <SpeedTester />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="staticResourceTester">
import { ref } from 'vue';
import ImageTester from './components/ImageTester/index.vue';
import VideoTester from './components/VideoTester/index.vue';
import SpeedTester from './components/SpeedTester/index.vue';

const activeTab = ref<string>('image');
</script>

<style scoped lang="scss">
.static-resource-tester {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;

  > h2 {
    flex-shrink: 0;
    padding: 24px 24px 0;
  }

  .tab-bar {
    flex-shrink: 0;
    padding: 0 24px;
  }

  .tab-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding: 0 24px 24px;
  }

  .tab-pane {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
