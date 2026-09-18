<template>
  <div class="speed-tester">
    <h3 class="section-title">静态资源下载测速</h3>
    <div class="panel-section">
      <a-textarea v-model:value="urlInput" class="url-input" />
      <a-button type="primary" class="test-btn" :loading="loading" @click="onSpeedTest">
        开始测速
      </a-button>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div v-if="results.length > 0 || loading" class="results-section">
      <div class="measure-info">
        <a-tag :color="measureMethod === 'performance' ? 'green' : 'orange'" size="small">
          {{ measureMethod === 'performance' ? 'Performance API' : '基础估算' }}
        </a-tag>
      </div>

      <div v-for="(item, index) in results" :key="index" class="meta-card">
        <div class="card-title">第 {{ index + 1 }} 次</div>
        <div class="meta-row">
          <strong>总耗时：</strong>
          {{ formatDuration(item.duration) }}
        </div>
        <div v-if="item.requestSentTime !== null" class="meta-row">
          <strong>请求发送：</strong>
          {{ formatDuration(item.requestSentTime) }}
        </div>
        <div v-if="item.waitingTime !== null" class="meta-row">
          <strong>等待响应(TTFB)：</strong>
          {{ formatDuration(item.waitingTime) }}
        </div>
        <div v-if="item.downloadTime !== null" class="meta-row">
          <strong>内容下载：</strong>
          {{ formatDuration(item.downloadTime) }}
        </div>
        <div class="meta-row">
          <strong>下载大小：</strong>
          {{ formatSize(item.totalBytes) }}
        </div>
        <div class="meta-row">
          <strong>平均速度：</strong>
          {{ formatSpeed(item) }}
        </div>
      </div>

      <div v-if="loading" class="testing-placeholder">
        正在进行第 {{ results.length + 1 }} 次测速...
      </div>

      <div v-if="!loading && results.length === TEST_COUNT" class="meta-card summary-card">
        <div class="card-title">三次平均</div>
        <div class="meta-row">
          <strong>平均速度：</strong>
          {{ avgSpeedText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="speedTester">
import { ref, computed } from 'vue';
import axios from 'axios';
import qs from 'qs';

/** 单次测速结果 */
interface SpeedResult {
  /** 总耗时（ms） */
  duration: number | null;
  /** 下载字节数 */
  totalBytes: number;
  /** 请求发送阶段耗时（ms），仅 Performance API 可用时有效 */
  requestSentTime: number | null;
  /** 等待服务器响应阶段耗时（ms），即 TTFB */
  waitingTime: number | null;
  /** 内容下载阶段耗时（ms） */
  downloadTime: number | null;
  /** 计算出的下载速度（bytes/s） */
  speed: number | null;
}

/** 连续测速次数 */
const TEST_COUNT = 3;

const urlInput = ref<string>(
  'https://dreamfit-oss-test.oss-us-east-1.aliyuncs.com/server/aigc/dreammirror/default/527522db-09d6-492b-b3e1-2eca0a303e24.webm',
);
const loading = ref<boolean>(false);
const errorMsg = ref<string>('');
const results = ref<SpeedResult[]>([]);
const measureMethod = ref<'performance' | 'basic'>('basic');

/**
 * 格式化耗时，ms 后追加括号展示可读时间
 * - 小于 1 秒：显示 "Xms"
 * - 1 秒 ~ 1 分钟：显示 "Xms（X秒）"
 * - 1 分钟以上：显示 "Xms（X分X秒）"
 */
const formatDuration = (ms: number | null): string => {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) {
    return `${ms}ms（${totalSec}秒）`;
  }
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${ms}ms（${minutes}分${seconds}秒）`;
};

/** 格式化文件大小，自动转换为 KB 或 MB */
const formatSize = (bytes: number): string => {
  if (!bytes) return '-';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
};

/** 格式化下载速度，自动转换为 KB/s 或 MB/s */
const formatSpeedStr = (bytesPerSec: number | null): string => {
  if (!bytesPerSec || bytesPerSec <= 0) return '-';
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
  }
  return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
};

/** 从测速结果中提取并格式化速度 */
const formatSpeed = (item: SpeedResult): string => formatSpeedStr(item.speed);

/** 三次测速的平均速度（仅取有效结果计算） */
const avgSpeedText = computed(() => {
  const validSpeeds = results.value
    .map(r => r.speed)
    .filter((s): s is number => s !== null && s > 0);
  if (validSpeeds.length === 0) return '-';
  const avg = validSpeeds.reduce((sum, s) => sum + s, 0) / validSpeeds.length;
  return formatSpeedStr(avg);
});

/** 重置测速状态和结果 */
const reset = () => {
  errorMsg.value = '';
  results.value = [];
  measureMethod.value = 'basic';
};

/**
 * 执行单次测速
 * 优先使用 Performance API 获取分阶段耗时（请求发送/等待响应/内容下载），
 * 若跨域未配置 Timing-Allow-Origin 或浏览器不支持，则降级为 performance.now() 估算总耗时
 */
const runSingleTest = async (baseUrl: string): Promise<SpeedResult> => {
  // 保留原有 query 参数，追加 _t 时间戳防缓存
  const urlObj = new URL(baseUrl);
  const params: Record<string, any> = qs.parse(urlObj.search, { ignoreQueryPrefix: true });
  params._t = Date.now();
  urlObj.search = qs.stringify(params);
  const cacheBustUrl = urlObj.toString();

  const startTime = performance.now();
  const response = await axios.get(cacheBustUrl, {
    responseType: 'arraybuffer',
  });
  const totalBytes = response.data.byteLength;

  const result: SpeedResult = {
    duration: null,
    totalBytes,
    requestSentTime: null,
    waitingTime: null,
    downloadTime: null,
    speed: null,
  };

  // 尝试用 Performance API 获取分阶段耗时
  // 注意：跨域资源需服务端返回 Timing-Allow-Origin 头，否则分阶段时间戳为 0
  const entries = performance.getEntriesByName(cacheBustUrl) as PerformanceResourceTiming[];
  const entry = entries.length > 0 ? entries[entries.length - 1] : null;

  if (entry && entry.requestStart > 0 && entry.responseStart > 0 && entry.responseEnd > 0) {
    // Performance API 可用，获取精确的分阶段耗时
    measureMethod.value = 'performance';
    // 请求发送阶段：fetchStart → requestStart（含 DNS、TCP 连接、请求发送）
    result.requestSentTime = Math.round(entry.requestStart - entry.fetchStart);
    // 等待响应阶段：requestStart → responseStart（即 TTFB）
    result.waitingTime = Math.round(entry.responseStart - entry.requestStart);
    // 内容下载阶段：responseStart → responseEnd
    result.downloadTime = Math.round(entry.responseEnd - entry.responseStart);
    // 总耗时：fetchStart → responseEnd
    result.duration = Math.round(entry.responseEnd - entry.fetchStart);
    // 用下载阶段耗时计算下载速度，排除请求和等待的干扰，更精确
    if (result.downloadTime > 0) {
      result.speed = totalBytes / (result.downloadTime / 1000);
    }
  } else {
    // 降级：Performance API 不可用或跨域受限，用 performance.now() 估算总耗时
    if (measureMethod.value !== 'performance') {
      measureMethod.value = 'basic';
    }
    result.duration = Math.round(performance.now() - startTime);
    // 用总耗时估算下载速度（包含请求发送和等待响应时间，精度较低）
    if (result.duration > 0) {
      result.speed = totalBytes / (result.duration / 1000);
    }
  }

  return result;
};

/** 点击测速按钮：连续执行 TEST_COUNT 次测速，展示每次详情和平均速度 */
const onSpeedTest = async () => {
  const url = urlInput.value.trim();
  if (!url) {
    errorMsg.value = '请输入资源链接';
    return;
  }

  loading.value = true;
  reset();

  try {
    for (let i = 0; i < TEST_COUNT; i++) {
      const result = await runSingleTest(url);
      results.value.push(result);
    }
  } catch (err: any) {
    errorMsg.value = `测速失败：${err.message || '未知错误'}`;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.speed-tester {
  width: 100%;

  .section-title {
    flex-shrink: 0;
    margin: 0 0 16px;
  }

  .panel-section {
    width: 100%;
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    align-items: flex-end;

    .url-input {
      flex: 1;
    }

    .test-btn {
      flex-shrink: 0;
    }
  }

  .error-msg {
    color: #ff4d4f;
    margin-bottom: 12px;
  }

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .measure-info {
    display: flex;
    align-items: center;
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

    .card-title {
      grid-column: 1 / -1;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .meta-row {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .summary-card {
    border-color: #69b1ff;
    background: #f0f7ff;
  }

  .testing-placeholder {
    color: #999;
    font-size: 13px;
    padding: 12px;
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    background: #fafafa;
  }
}
</style>
