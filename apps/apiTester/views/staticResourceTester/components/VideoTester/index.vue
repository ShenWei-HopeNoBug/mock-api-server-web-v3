<template>
  <div class="video-tester">
    <a-card title="视频列表" class="video-config-card">
      <div class="video-url-list">
        <div
          v-for="(item, index) in videoUrlItems"
          :key="`${item.id}_${index}`"
          class="video-url-row"
        >
          <StaticUrlInput v-model:value="item.url" class="url-input" />
          <a-button
            danger
            shape="circle"
            size="small"
            class="remove-btn"
            @click="onRemoveVideoUrl(index)"
          >
            <template #icon><MinusOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="video-actions">
        <a-button @click="onAddVideoUrl">
          <template #icon><PlusOutlined /></template>
          添加一行
        </a-button>
        <a-button type="primary" @click="onUpdateVideos">更新轮播列表</a-button>
        <a-button @click="onClearVideoLog">清空日志</a-button>
      </div>
    </a-card>

    <div class="video-preview-row">
      <a-card title="轮播预览" class="video-preview-card">
        <div class="video-box">
          <CarouselVideo
            v-if="videoList.length"
            :videos="videoList"
            :immediate-update="true"
            :muted="true"
            :loading-timeout="30000"
            :video-style="{ width: '100%', height: '100%' }"
            @all-videos-error="onAllVideosError"
            @loading-timeout="onLoadingTimeout"
          />
          <div v-else class="video-placeholder">请输入视频 URL 并点击"更新轮播列表"</div>
        </div>
      </a-card>

      <a-card title="网络请求日志" class="video-log-card">
        <div class="log-list">
          <div v-for="(log, i) in videoLog" :key="i" class="log-item">{{ log }}</div>
          <div v-if="!videoLog.length" class="log-empty">暂无视频资源加载记录</div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script lang="ts" setup name="videoTester">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue';
import CarouselVideo from '@/components/CarouselVideo/index.vue';
import StaticUrlInput from '../StaticUrlInput/index.vue';
import { generateUUID } from '@/utils';
import { StaticResourceTesterType } from '../../type';

const videoUrlItems = ref<StaticResourceTesterType.VideoUrlItem[]>([
  {
    id: generateUUID(),
    url: 'http://localhost:5000/slow_network/17a00905-0147-4841-88f4-188347230c55.webm',
  },
]);
const videoList = ref<StaticResourceTesterType.VideoItem[]>([]);

const videoLog = ref<string[]>([]);
let perfObserver: PerformanceObserver | null = null;

const isVideoUrl = (url: string): boolean => /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);

const timeNow = () => new Date().toLocaleTimeString();

const onAddVideoUrl = () => {
  videoUrlItems.value.push({ id: generateUUID(), url: '' });
};

const onRemoveVideoUrl = (index: number) => {
  if (videoUrlItems.value.length > 1) {
    videoUrlItems.value.splice(index, 1);
  }
};

const onUpdateVideos = () => {
  const urls = videoUrlItems.value.map(item => item.url.trim()).filter(Boolean);

  videoList.value = urls.map((url, index) => ({
    key: `${index}-${generateUUID()}`,
    video_url: url,
    poster_url: '',
  }));
};

const onAllVideosError = (videos: StaticResourceTesterType.VideoItem[]) => {
  videoLog.value.unshift(`[${timeNow()}] 所有视频加载失败：${videos.length} 个`);
};

const onLoadingTimeout = (payload: StaticResourceTesterType.LoadingTimeoutPayload) => {
  const url = payload.video?.video_url || '';
  videoLog.value.unshift(`[${timeNow()}] 视频加载超时：${url}，等待 ${payload.duration}ms`);
};

const onClearVideoLog = () => {
  videoLog.value = [];
};

const handleResourceEntry = (entry: PerformanceResourceTiming) => {
  if (isVideoUrl(entry.name)) {
    console.log(entry);
    const status = (entry as any).responseStatus ?? '-';
    const size = entry.encodedBodySize ? `${(entry.encodedBodySize / 1024).toFixed(2)} KB` : '-';
    const line = `[${timeNow()}] ${entry.name}  status=${status}  duration=${Math.round(
      entry.duration,
    )}ms  size=${size}`;
    videoLog.value.push(line);
    if (videoLog.value.length > 50) {
      videoLog.value.shift();
    }
  }
};

onMounted(() => {
  if ('PerformanceObserver' in window) {
    perfObserver = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        handleResourceEntry(entry as PerformanceResourceTiming);
      });
    });
    perfObserver.observe({ entryTypes: ['resource'] });
  }
});

onBeforeUnmount(() => {
  perfObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.video-tester {
  .video-config-card {
    margin-bottom: 16px;
  }

  .video-preview-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    align-items: stretch;
    height: 500px;

    .video-preview-card {
      width: 268px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      :deep(.ant-card-body) {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .video-log-card {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      :deep(.ant-card-body) {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding-right: 12px;
      }
    }
  }

  .video-url-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .video-url-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    .url-input {
      flex: 1;
    }

    .remove-btn {
      margin-bottom: 4px;
    }
  }

  .video-actions {
    display: flex;
    gap: 8px;
  }

  .video-box {
    height: 100%;
    aspect-ratio: 9 / 16;
    border-radius: 4px;
    overflow: hidden;
    background: #000;

    .video-placeholder {
      height: 100%;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #999;
      padding: 20px;
      font-size: 14px;
      text-align: center;
    }
  }

  .log-list {
    flex: 1;
    overflow: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
    font-size: 12px;
    padding-right: 12px;

    .log-item {
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
      word-break: break-all;
    }

    .log-empty {
      color: #999;
      padding: 12px 0;
    }
  }
}
</style>
